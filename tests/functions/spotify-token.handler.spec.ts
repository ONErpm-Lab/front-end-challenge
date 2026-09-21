import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { onRequest, onRequestPost } from '../../functions/api/spotify-token';

const ENV = { SPOTIFY_CLIENT_ID: 'the-id', SPOTIFY_CLIENT_SECRET: 'the-secret' };

// Only the fields the handler actually reads.
const call = (env: Record<string, string | undefined>) =>
  (onRequestPost as unknown as (c: { env: unknown }) => Promise<Response>)({ env });

describe('POST /api/spotify-token', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const spotifyReturns = (body: unknown, status = 200) =>
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

  it('returns the access token and nothing else', async () => {
    spotifyReturns({ access_token: 'abc', expires_in: 3600, refresh_token: 'LEAK' });

    const response = await call(ENV);

    expect(response.status).toBe(200);
    expect(Object.keys(await response.json()).sort()).toEqual([
      'access_token',
      'expires_in',
      'token_type',
    ]);
  });

  it('forbids caching, because the token is short-lived and per-request', async () => {
    spotifyReturns({ access_token: 'abc', expires_in: 3600 });

    expect((await call(ENV)).headers.get('Cache-Control')).toBe('no-store');
  });

  it('answers 503 when the environment has no credentials', async () => {
    const response = await call({});

    expect(response.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('answers 502 when Spotify rejects the credentials', async () => {
    spotifyReturns({ error: 'invalid_client' }, 401);

    expect((await call(ENV)).status).toBe(502);
  });

  it('passes a rate limit through as 429 so the client can back off', async () => {
    spotifyReturns({ error: 'slow down' }, 429);

    expect((await call(ENV)).status).toBe(429);
  });

  it('never echoes the secret or the upstream body to the browser', async () => {
    spotifyReturns({ error: 'invalid_client', error_description: 'the-secret is wrong' }, 401);

    const body = await (await call(ENV)).text();

    expect(body).not.toContain('the-secret');
    expect(body).not.toContain('invalid_client');
    expect(JSON.parse(body)).toEqual({ error: 'provider_unavailable' });
  });

  it('answers 502 when the network fails outright', async () => {
    fetchMock.mockRejectedValue(new TypeError('network down'));

    expect((await call(ENV)).status).toBe(502);
  });

  it('rejects any method other than POST', async () => {
    const response = await (onRequest as unknown as () => Promise<Response>)();

    expect(response.status).toBe(405);
    expect(await response.json()).toEqual({ error: 'method_not_allowed' });
  });
});
