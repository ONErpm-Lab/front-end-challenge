// @vitest-environment node
import { spotifyTrack } from '../testing/builders';
import { jsonResponse } from '../testing/fake-spotify';
import { SpotifyClient } from './spotify-client';
import { SpotifyUnavailableError } from './spotify-errors';
import { SpotifyFailureReason } from './spotify.enums';
import { AccessTokenProvider } from './spotify.interfaces';

function setup(responses: (() => Response | Promise<Response>)[]) {
  let issued = 0;
  const tokens: AccessTokenProvider = {
    getToken: vi.fn(async () => `token-${++issued}`),
    invalidate: vi.fn(),
  };
  const fetchFn = vi.fn<typeof fetch>();
  for (const respond of responses) {
    fetchFn.mockImplementationOnce(async () => respond());
  }
  const sleep = vi.fn(async () => undefined);
  const clock = { now: 1_000_000 };
  const client = new SpotifyClient(tokens, { fetchFn, sleep, now: () => clock.now });
  return { client, tokens, fetchFn, sleep, clock };
}

const ok =
  (...tracks: ReturnType<typeof spotifyTrack>[]) =>
  () =>
    jsonResponse({ tracks: { items: tracks } });
const page = (tracks: ReturnType<typeof spotifyTrack>[], next: string | null) => () =>
  jsonResponse({ tracks: { items: tracks, next } });
const NEXT = 'https://api.spotify.com/v1/search?offset=10';
const failure = (status: number, headers?: Record<string, string>) => () =>
  new Response('', { status, headers });

describe('SpotifyClient.searchByIsrc', () => {
  it('searches tracks by ISRC with the bearer token and the API limit of 10', async () => {
    const track = spotifyTrack();
    const { client, fetchFn } = setup([ok(track)]);

    await expect(client.searchByIsrc('BR1SP1200071', { market: 'BR' })).resolves.toEqual([track]);

    const [url, init] = fetchFn.mock.calls[0];
    const params = new URL(String(url)).searchParams;
    expect(new URL(String(url)).origin + new URL(String(url)).pathname).toBe(
      'https://api.spotify.com/v1/search',
    );
    expect(params.get('q')).toBe('isrc:BR1SP1200071');
    expect(params.get('type')).toBe('track');
    expect(params.get('limit')).toBe('10');
    expect(params.get('market')).toBe('BR');
    expect((init?.headers as Record<string, string>)['Authorization']).toBe('Bearer token-1');
  });

  it('omits the market parameter when none is given', async () => {
    const { client, fetchFn } = setup([ok()]);

    await client.searchByIsrc('BR1SP1200071');

    expect(new URL(String(fetchFn.mock.calls[0][0])).searchParams.has('market')).toBe(false);
  });

  it('returns an empty list when Spotify has no match', async () => {
    const { client } = setup([ok()]);

    await expect(client.searchByIsrc('BR1SP1200071')).resolves.toEqual([]);
  });

  describe('pagination', () => {
    it('follows the next pages and returns every track, 10 per request', async () => {
      const first = spotifyTrack({ id: 'first' });
      const second = spotifyTrack({ id: 'second' });
      const { client, fetchFn } = setup([page([first], NEXT), page([second], null)]);

      const tracks = await client.searchByIsrc('BR1SP1200071', { market: 'BR' });

      expect(tracks.map((track) => track.id)).toEqual(['first', 'second']);
      const requests = fetchFn.mock.calls.map(([url]) => new URL(String(url)).searchParams);
      expect(requests.map((params) => params.get('offset'))).toEqual(['0', '10']);
      expect(requests.map((params) => params.get('limit'))).toEqual(['10', '10']);
      expect(requests.map((params) => params.get('market'))).toEqual(['BR', 'BR']);
    });

    it('stops at the last page', async () => {
      const { client, fetchFn } = setup([page([spotifyTrack()], null)]);

      await client.searchByIsrc('BR1SP1200071');

      expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    it('never requests more than 5 pages, even if Spotify keeps offering more', async () => {
      const { client, fetchFn } = setup(
        Array.from({ length: 8 }, () => page([spotifyTrack()], NEXT)),
      );

      const tracks = await client.searchByIsrc('BR1SP1200071');

      expect(fetchFn).toHaveBeenCalledTimes(5);
      expect(tracks).toHaveLength(5);
    });

    it('fails the whole search when a later page fails', async () => {
      const { client } = setup([page([spotifyTrack()], NEXT), failure(500)]);

      await expect(client.searchByIsrc('BR1SP1200071')).rejects.toMatchObject({
        reason: SpotifyFailureReason.SEARCH_FAILED,
        status: 500,
      });
    });

    it('still retries a rate-limited later page on its own', async () => {
      const { client, sleep } = setup([
        page([spotifyTrack({ id: 'a' })], NEXT),
        failure(429, { 'Retry-After': '1' }),
        page([spotifyTrack({ id: 'b' })], null),
      ]);

      const tracks = await client.searchByIsrc('BR1SP1200071');

      expect(tracks.map((track) => track.id)).toEqual(['a', 'b']);
      expect(sleep).toHaveBeenCalledExactlyOnceWith(1000);
    });
  });

  describe('401 Unauthorized', () => {
    it('drops the token and retries once with a fresh one', async () => {
      const track = spotifyTrack();
      const { client, tokens, fetchFn } = setup([failure(401), ok(track)]);

      await expect(client.searchByIsrc('BR1SP1200071')).resolves.toEqual([track]);

      expect(tokens.invalidate).toHaveBeenCalledTimes(1);
      expect((fetchFn.mock.calls[1][1]?.headers as Record<string, string>)['Authorization']).toBe(
        'Bearer token-2',
      );
    });

    it('gives up if the fresh token is rejected too', async () => {
      const { client, fetchFn } = setup([failure(401), failure(401)]);

      await expect(client.searchByIsrc('BR1SP1200071')).rejects.toMatchObject({
        reason: SpotifyFailureReason.SEARCH_FAILED,
        status: 401,
      });
      expect(fetchFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('429 Too Many Requests', () => {
    it('waits for Retry-After and retries once', async () => {
      const track = spotifyTrack();
      const { client, sleep } = setup([failure(429, { 'Retry-After': '2' }), ok(track)]);

      await expect(client.searchByIsrc('BR1SP1200071')).resolves.toEqual([track]);

      expect(sleep).toHaveBeenCalledExactlyOnceWith(2000);
    });

    it('assumes a short wait when Retry-After is missing or invalid', async () => {
      const track = spotifyTrack();
      const { client, sleep } = setup([
        failure(429),
        failure(429, { 'Retry-After': 'soon' }),
        ok(track),
      ]);

      await expect(client.searchByIsrc('A')).rejects.toMatchObject({ status: 429 });
      await expect(client.searchByIsrc('B')).resolves.toEqual([track]);

      expect(sleep).toHaveBeenCalledWith(1000);
    });

    it('retries only once', async () => {
      const { client, sleep, fetchFn } = setup([
        failure(429, { 'Retry-After': '1' }),
        failure(429, { 'Retry-After': '1' }),
      ]);

      await expect(client.searchByIsrc('BR1SP1200071')).rejects.toMatchObject({
        reason: SpotifyFailureReason.SEARCH_FAILED,
        status: 429,
      });
      expect(sleep).toHaveBeenCalledTimes(1);
      expect(fetchFn).toHaveBeenCalledTimes(2);
    });

    describe('cooldown shared by every search', () => {
      it('fails fast, without sleeping, when the wait is too long to hold a user request', async () => {
        const { client, sleep } = setup([failure(429, { 'Retry-After': '30' })]);

        await expect(client.searchByIsrc('BR1SP1200071')).rejects.toMatchObject({
          reason: SpotifyFailureReason.RATE_LIMITED,
          status: 429,
        });
        expect(sleep).not.toHaveBeenCalled();
      });

      it('says how long Spotify asked us to wait, so the log shows why the page is down', async () => {
        const { client } = setup([failure(429, { 'Retry-After': '3403' })]);

        const error = await client.searchByIsrc('A').catch((e: unknown) => e);

        expect(error).toMatchObject({ status: 429, retryAfterMs: 3_403_000 });
        expect((error as Error).message).toContain('retry after 3403s');
      });

      it('rejects other searches locally, without calling Spotify, until the cooldown ends', async () => {
        const { client, fetchFn } = setup([failure(429, { 'Retry-After': '30' })]);
        await expect(client.searchByIsrc('A')).rejects.toBeInstanceOf(SpotifyUnavailableError);

        await expect(client.searchByIsrc('B')).rejects.toMatchObject({
          reason: SpotifyFailureReason.RATE_LIMITED,
        });
        await expect(client.searchByIsrc('C', { market: 'BR' })).rejects.toMatchObject({
          reason: SpotifyFailureReason.RATE_LIMITED,
        });

        expect(fetchFn).toHaveBeenCalledTimes(1);
      });

      it('resumes calling Spotify once the cooldown has elapsed', async () => {
        const track = spotifyTrack();
        const { client, clock, fetchFn } = setup([
          failure(429, { 'Retry-After': '30' }),
          ok(track),
        ]);
        await expect(client.searchByIsrc('A')).rejects.toBeInstanceOf(SpotifyUnavailableError);

        clock.now += 30_000;

        await expect(client.searchByIsrc('B')).resolves.toEqual([track]);
        expect(fetchFn).toHaveBeenCalledTimes(2);
      });

      it('makes the next search wait out a short cooldown before sending anything', async () => {
        const track = spotifyTrack();
        const { client, sleep, clock } = setup([
          failure(429, { 'Retry-After': '2' }),
          ok(track),
          ok(track),
        ]);
        await client.searchByIsrc('A');
        sleep.mockClear();
        clock.now += 500;

        await client.searchByIsrc('B');

        expect(sleep).toHaveBeenCalledExactlyOnceWith(1500);
      });

      it('does not delay searches after the cooldown has passed', async () => {
        const track = spotifyTrack();
        const { client, sleep, clock } = setup([
          failure(429, { 'Retry-After': '2' }),
          ok(track),
          ok(track),
        ]);
        await client.searchByIsrc('A');
        sleep.mockClear();
        clock.now += 2_000;

        await client.searchByIsrc('B');

        expect(sleep).not.toHaveBeenCalled();
      });
    });
  });

  it.each([400, 403, 500, 503])(
    'maps HTTP %i to an unavailable-integration error',
    async (status) => {
      const { client } = setup([failure(status)]);

      await expect(client.searchByIsrc('BR1SP1200071')).rejects.toMatchObject({
        name: 'SpotifyUnavailableError',
        reason: SpotifyFailureReason.SEARCH_FAILED,
        status,
      });
    },
  );

  it('wraps network errors', async () => {
    const { client } = setup([() => Promise.reject(new TypeError('fetch failed'))]);

    const error = await client.searchByIsrc('BR1SP1200071').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(SpotifyUnavailableError);
    expect((error as SpotifyUnavailableError).reason).toBe(
      SpotifyFailureReason.SEARCH_NETWORK_ERROR,
    );
  });

  it.each([
    ['not JSON', () => new Response('oops', { status: 200 })],
    ['no tracks object', () => jsonResponse({})],
    ['items is not a list', () => jsonResponse({ tracks: { items: null } })],
    ['a null item', () => jsonResponse({ tracks: { items: [null] } })],
    [
      'an item without artists',
      () => jsonResponse({ tracks: { items: [{ ...spotifyTrack(), artists: undefined }] } }),
    ],
    [
      'an item without duration',
      () => jsonResponse({ tracks: { items: [{ ...spotifyTrack(), duration_ms: undefined }] } }),
    ],
    [
      'one bad item among valid ones',
      () => jsonResponse({ tracks: { items: [spotifyTrack(), { id: 'broken' }] } }),
    ],
  ])('rejects a malformed payload (%s)', async (_label, respond) => {
    const { client } = setup([respond]);

    await expect(client.searchByIsrc('BR1SP1200071')).rejects.toMatchObject({
      reason: SpotifyFailureReason.SEARCH_RESPONSE_MALFORMED,
    });
  });
});
