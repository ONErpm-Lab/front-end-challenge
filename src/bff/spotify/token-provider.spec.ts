// @vitest-environment node
import { jsonResponse } from '../testing/fake-spotify';
import { SpotifyUnavailableError } from './spotify-errors';
import { SpotifyFailureReason } from './spotify.enums';
import { SpotifyTokenProvider } from './token-provider';

const CREDENTIALS = { clientId: 'my-id', clientSecret: 'my-secret' };

function setup(responses: (() => Response | Promise<Response>)[]) {
  const clock = { now: 1_000_000 };
  const fetchFn = vi.fn<typeof fetch>();
  for (const respond of responses) {
    fetchFn.mockImplementationOnce(async () => respond());
  }
  const provider = new SpotifyTokenProvider(CREDENTIALS, { fetchFn, now: () => clock.now });
  return { provider, fetchFn, clock };
}

const token =
  (value: string, expiresIn = 3600) =>
  () =>
    jsonResponse({ access_token: value, expires_in: expiresIn });

describe('SpotifyTokenProvider', () => {
  it('requests a client-credentials token with HTTP Basic auth', async () => {
    const { provider, fetchFn } = setup([token('abc')]);

    await expect(provider.getToken()).resolves.toBe('abc');

    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe('https://accounts.spotify.com/api/token');
    expect(init?.method).toBe('POST');
    expect(init?.body).toBe('grant_type=client_credentials');
    const expectedBasic = Buffer.from('my-id:my-secret').toString('base64');
    expect((init?.headers as Record<string, string>)['Authorization']).toBe(
      `Basic ${expectedBasic}`,
    );
  });

  it('reuses the cached token while it is valid', async () => {
    const { provider, fetchFn, clock } = setup([token('abc')]);

    await provider.getToken();
    clock.now += 30 * 60_000;
    await provider.getToken();

    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('renews shortly before the token expires', async () => {
    const { provider, fetchFn, clock } = setup([token('first'), token('second')]);

    await provider.getToken();
    clock.now += 3600_000 - 60_000; // exactly at the early-renewal margin
    const renewed = await provider.getToken();

    expect(renewed).toBe('second');
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('shares one request among concurrent callers (single-flight)', async () => {
    const { provider, fetchFn } = setup([token('abc')]);

    const tokens = await Promise.all([
      provider.getToken(),
      provider.getToken(),
      provider.getToken(),
    ]);

    expect(tokens).toEqual(['abc', 'abc', 'abc']);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('fetches a new token after invalidate()', async () => {
    const { provider, fetchFn } = setup([token('old'), token('new')]);

    await provider.getToken();
    provider.invalidate();

    await expect(provider.getToken()).resolves.toBe('new');
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('fails with a stable reason when Spotify rejects the credentials, and retries on the next call', async () => {
    const { provider } = setup([
      () => jsonResponse({ error: 'invalid_client' }, { status: 400 }),
      token('ok'),
    ]);

    await expect(provider.getToken()).rejects.toMatchObject({
      name: 'SpotifyUnavailableError',
      reason: SpotifyFailureReason.TOKEN_REQUEST_FAILED,
      status: 400,
    });
    await expect(provider.getToken()).resolves.toBe('ok');
  });

  it('wraps network errors', async () => {
    const { provider } = setup([() => Promise.reject(new TypeError('fetch failed'))]);

    const failure = await provider.getToken().catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(SpotifyUnavailableError);
    expect((failure as SpotifyUnavailableError).reason).toBe(
      SpotifyFailureReason.TOKEN_REQUEST_NETWORK_ERROR,
    );
  });

  it.each([
    ['not JSON', () => new Response('<html>', { status: 200 })],
    ['missing access_token', () => jsonResponse({ expires_in: 3600 })],
    ['missing expires_in', () => jsonResponse({ access_token: 'abc' })],
  ])('rejects a malformed response (%s)', async (_label, respond) => {
    const { provider } = setup([respond]);

    await expect(provider.getToken()).rejects.toMatchObject({
      reason: SpotifyFailureReason.TOKEN_RESPONSE_MALFORMED,
    });
  });
});
