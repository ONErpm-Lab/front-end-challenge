// @vitest-environment node
import express from 'express';
import { Server } from 'node:http';
import { AddressInfo } from 'node:net';
import {
  ApiErrorCode,
  LookupErrorCode,
  LookupStatus,
  ReleaseDatePrecision,
} from '../../contract/tracks.enums';
import { ApiError, TracksResponse } from '../../contract/tracks.interfaces';
import { SpotifyTrack } from '../spotify/spotify.interfaces';
import { spotifyAlbum, spotifyTrack } from '../testing/builders';
import { createFakeSpotify, FakeSpotifyOptions } from '../testing/fake-spotify';
import { CHALLENGE_ISRCS, recordedTracks } from '../testing/fixtures';
import { createApiRouter } from './create-api-router';

const ENV = { SPOTIFY_CLIENT_ID: 'id', SPOTIFY_CLIENT_SECRET: 'secret' };
const silentLogger = { warn: vi.fn(), error: vi.fn() };

let server: Server;
let baseUrl: string;

/** Boots the real Express router (mounted at /api like in server.ts) against a fake Spotify. */
async function startApi(spotify: Partial<FakeSpotifyOptions> = {}, env: NodeJS.ProcessEnv = ENV) {
  const fake = createFakeSpotify({
    search: ({ isrc, market }) => (market === 'BR' ? recordedTracks(isrc) : []),
    ...spotify,
  });
  const app = express();
  app.use(
    '/api',
    createApiRouter({
      env,
      fetchFn: fake.fetchFn,
      logger: silentLogger,
      sleep: async () => undefined,
    }),
  );

  server = await new Promise<Server>((resolve) => {
    const listening = app.listen(0, '127.0.0.1', () => resolve(listening));
  });
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  return fake;
}

const get = (path: string) => fetch(`${baseUrl}${path}`);

afterEach(async () => {
  await new Promise<void>((resolve) => server?.close(() => resolve()));
  vi.clearAllMocks();
});

describe('GET /api/health', () => {
  it('says the server is up, never cached, and without calling Spotify', async () => {
    const fake = await startApi();

    const response = await get('/api/health');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok', spotify: 'configured' });
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(fake.searches).toHaveLength(0);
    expect(fake.tokenRequests()).toBe(0);
  });

  it('answers even when Spotify credentials are missing, and says so', async () => {
    await startApi({}, {});

    const response = await get('/api/health');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok', spotify: 'missing_credentials' });
  });
});

describe('GET /api/tracks', () => {
  describe('with the 10 ISRCs of the challenge', () => {
    it('returns all of them found and available in Brazil', async () => {
      await startApi();

      const response = await get(`/api/tracks?isrc=${CHALLENGE_ISRCS.join(',')}`);
      const body = (await response.json()) as TracksResponse;

      expect(response.status).toBe(200);
      expect(body.results).toHaveLength(10);
      expect(body.results.every((result) => result.status === LookupStatus.FOUND)).toBe(true);
      for (const result of body.results) {
        if (result.status !== LookupStatus.FOUND) {
          continue;
        }
        expect(result.track).toMatchObject({
          isrc: result.isrc,
          availableInBR: true,
          coverUrl: expect.stringContaining('https://i.scdn.co/image/'),
          spotifyUrl: expect.stringContaining('https://open.spotify.com/track/'),
        });
        expect(result.track.artists.length).toBeGreaterThan(0);
        expect(result.track.durationMs).toBeGreaterThan(0);
      }
    });

    it('exposes the fields the page renders for a known track', async () => {
      await startApi();

      const body = (await (await get('/api/tracks?isrc=BRC310600002')).json()) as TracksResponse;

      expect(body.results[0]).toMatchObject({
        status: LookupStatus.FOUND,
        track: {
          title: 'Repente',
          artists: ['PianOrquestra'],
          releaseDate: { value: '2013-06-13', precision: ReleaseDatePrecision.DAY },
          durationMs: 170_733,
          spotifyUrl: 'https://open.spotify.com/track/4lwE7ainG51zmxt1xAC7XQ',
        },
      });
    });

    it('chooses the original release when an ISRC lives on an album and on a single', async () => {
      await startApi();

      const body = (await (await get('/api/tracks?isrc=BR1SP1200071')).json()) as TracksResponse;

      expect(body.results[0]).toMatchObject({
        status: LookupStatus.FOUND,
        track: { id: '4s71Bub5KzXBSMyE8nlH4E', releaseDate: { value: '2014-03-25' } },
      });
    });
  });

  it('finds the original release even when it only shows up on the second page of results', async () => {
    const reissues = Array.from({ length: 10 }, (_, i) =>
      spotifyTrack({
        id: `reissue-${i}`,
        album: spotifyAlbum({ release_date: `2022-01-${String(i + 1).padStart(2, '0')}` }),
      }),
    );
    const original = spotifyTrack({
      id: 'original',
      album: spotifyAlbum({ release_date: '2010-05-05' }),
    });
    const fake = await startApi({ search: () => [...reissues, original] });

    const body = (await (await get('/api/tracks?isrc=BR1SP1200071')).json()) as TracksResponse;

    expect(body.results[0]).toMatchObject({
      status: LookupStatus.FOUND,
      track: { id: 'original', releaseDate: { value: '2010-05-05' } },
    });
    expect(fake.searches.map((search) => search.offset)).toEqual([0, 10]);
  });

  it('reports ISRCs Spotify does not know without failing the request', async () => {
    await startApi({ search: ({ isrc }) => (isrc === 'BR1SP1200071' ? [spotifyTrack()] : []) });

    const body = (await (
      await get('/api/tracks?isrc=BR1SP1200071,BR1SP1200070')
    ).json()) as TracksResponse;

    expect(body.results.map((result) => result.status)).toEqual([
      LookupStatus.FOUND,
      LookupStatus.NOT_FOUND,
    ]);
  });

  it('flags a track that exists but is not playable in Brazil', async () => {
    await startApi({ search: () => [spotifyTrack({ is_playable: false })] });

    const body = (await (await get('/api/tracks?isrc=BR1SP1200071')).json()) as TracksResponse;

    expect(body.results[0]).toMatchObject({
      status: LookupStatus.FOUND,
      track: { availableInBR: false },
    });
  });

  it('keeps the healthy results when one ISRC hits a Spotify error', async () => {
    await startApi({
      search: ({ isrc }): SpotifyTrack[] | Response =>
        isrc === 'BR1SP1200070' ? new Response('', { status: 500 }) : [spotifyTrack()],
    });

    const response = await get('/api/tracks?isrc=BR1SP1200071,BR1SP1200070');
    const body = (await response.json()) as TracksResponse;

    expect(response.status).toBe(200);
    expect(body.results).toMatchObject([
      { status: LookupStatus.FOUND },
      { status: LookupStatus.ERROR, code: LookupErrorCode.INTEGRATION_UNAVAILABLE },
    ]);
  });

  it('forbids caching a response that contains a failed lookup, so a retry reaches the BFF', async () => {
    await startApi({
      search: ({ isrc }): SpotifyTrack[] | Response =>
        isrc === 'BR1SP1200070' ? new Response('', { status: 500 }) : [spotifyTrack()],
    });

    const partial = await get('/api/tracks?isrc=BR1SP1200071,BR1SP1200070');
    const healthy = await get('/api/tracks?isrc=BR1SP1200071');

    expect(partial.headers.get('cache-control')).toBe('no-store');
    expect(healthy.headers.get('cache-control')).toBe(
      'public, max-age=60, s-maxage=3600, stale-while-revalidate=86400, stale-if-error=86400',
    );
  });

  it('answers 503 integration_unavailable when Spotify auth is down', async () => {
    await startApi({ tokenStatus: 500 });

    const response = await get('/api/tracks?isrc=BR1SP1200071,BR1SP1200070');
    const body = (await response.json()) as ApiError;

    expect(response.status).toBe(503);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(body.code).toBe(ApiErrorCode.INTEGRATION_UNAVAILABLE);
  });

  it('answers 503 when Spotify search fails for every ISRC', async () => {
    await startApi({ search: () => new Response('', { status: 503 }) });

    const response = await get('/api/tracks?isrc=BR1SP1200071');

    expect(response.status).toBe(503);
  });

  it('answers 503 when the Spotify credentials are not configured, never leaking details', async () => {
    await startApi({}, {});

    const response = await get('/api/tracks?isrc=BR1SP1200071');
    const text = await response.text();

    expect(response.status).toBe(503);
    expect(JSON.parse(text)).toMatchObject({ code: ApiErrorCode.INTEGRATION_UNAVAILABLE });
    expect(text).not.toContain('SPOTIFY');
  });

  it('bounds simultaneous Spotify searches across overlapping requests', async () => {
    const isrcs = (prefix: string) =>
      Array.from({ length: 10 }, (_, i) => `${prefix}${String(i).padStart(5, '0')}`).join(',');
    const fake = await startApi({
      search: async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        return [spotifyTrack()];
      },
    });

    const [first, second] = await Promise.all([
      get(`/api/tracks?isrc=${isrcs('BR1SP12')}`),
      get(`/api/tracks?isrc=${isrcs('BR1SP13')}`),
    ]);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(fake.searches).toHaveLength(20);
    expect(fake.peakConcurrentSearches()).toBe(5);
  });

  it('serves repeated lookups from cache, without calling Spotify again', async () => {
    const fake = await startApi();

    await get('/api/tracks?isrc=BRC310600002');
    await get('/api/tracks?isrc=BRC310600002');

    expect(fake.searches).toHaveLength(1);
    expect(fake.tokenRequests()).toBe(1);
  });

  it('lets browsers reuse a complete answer for a minute and a shared cache keep it for an hour', async () => {
    await startApi();

    const response = await get('/api/tracks?isrc=BRC310600002');
    const cacheControl = response.headers.get('cache-control') ?? '';

    expect(cacheControl).toContain('public');
    expect(cacheControl).toContain('max-age=60');
    expect(cacheControl).toContain('s-maxage=3600');
    expect(cacheControl).toContain('stale-while-revalidate');
  });

  describe('validation', () => {
    it.each([
      ['no ISRC', '/api/tracks'],
      ['an empty ISRC', '/api/tracks?isrc='],
    ])('rejects %s with 400', async (_label, path) => {
      await startApi();

      const response = await get(path);

      expect(response.status).toBe(400);
      expect(((await response.json()) as ApiError).code).toBe(ApiErrorCode.INVALID_ISRC);
    });

    it('lists the malformed ISRCs and does not call Spotify', async () => {
      const fake = await startApi();

      const response = await get('/api/tracks?isrc=BRC310600002,NOPE');
      const body = (await response.json()) as ApiError;

      expect(response.status).toBe(400);
      expect(body).toMatchObject({ code: ApiErrorCode.INVALID_ISRC, invalid: ['NOPE'] });
      expect(fake.searches).toHaveLength(0);
    });

    it('rejects more than 20 ISRCs', async () => {
      await startApi();
      const many = Array.from(
        { length: 21 },
        (_, i) => `BR1SP12${String(i).padStart(5, '0')}`,
      ).join(',');

      const response = await get(`/api/tracks?isrc=${many}`);

      expect(response.status).toBe(400);
      expect(((await response.json()) as ApiError).code).toBe(ApiErrorCode.TOO_MANY_ISRCS);
    });
  });
});

describe('unknown API routes', () => {
  it('answers a JSON 404 instead of falling through to the SSR renderer', async () => {
    await startApi();

    const response = await get('/api/nope');

    expect(response.status).toBe(404);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(((await response.json()) as ApiError).code).toBe(ApiErrorCode.NOT_FOUND);
  });
});
