import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { requestAccessToken, TokenRequestError } from '../../functions/spotify-token.service';

const CREDENTIALS = { clientId: 'the-id', clientSecret: 'the-secret' };

const okResponse = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

describe('requestAccessToken', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('exchanges the credentials for a token using HTTP Basic auth', async () => {
    fetchMock.mockResolvedValue(
      okResponse({ access_token: 'abc', expires_in: 3600, token_type: 'Bearer' }),
    );

    await expect(requestAccessToken(CREDENTIALS)).resolves.toEqual({
      access_token: 'abc',
      expires_in: 3600,
      token_type: 'Bearer',
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://accounts.spotify.com/api/token');
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe(`Basic ${btoa('the-id:the-secret')}`);
    expect(init.body.toString()).toBe('grant_type=client_credentials');
  });

  it('never puts the secret in the URL or the body', async () => {
    fetchMock.mockResolvedValue(okResponse({ access_token: 'abc', expires_in: 3600 }));

    await requestAccessToken(CREDENTIALS);

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).not.toContain('the-secret');
    expect(init.body.toString()).not.toContain('the-secret');
  });

  it('returns only the fields we declare, so nothing upstream leaks through', async () => {
    fetchMock.mockResolvedValue(
      okResponse({ access_token: 'abc', expires_in: 3600, refresh_token: 'LEAK', scope: 'LEAK' }),
    );

    const token = await requestAccessToken(CREDENTIALS);

    expect(Object.keys(token).sort()).toEqual(['access_token', 'expires_in', 'token_type']);
  });

  it('defaults the token type when Spotify omits it', async () => {
    fetchMock.mockResolvedValue(okResponse({ access_token: 'abc', expires_in: 3600 }));

    await expect(requestAccessToken(CREDENTIALS)).resolves.toMatchObject({ token_type: 'Bearer' });
  });

  it.each([400, 401, 429, 500])(
    'raises a TokenRequestError carrying the %i status',
    async (status) => {
      fetchMock.mockResolvedValue(new Response('nope', { status }));

      await expect(requestAccessToken(CREDENTIALS)).rejects.toMatchObject({
        name: 'TokenRequestError',
        status,
      });
    },
  );

  it.each([
    ['no access_token', { expires_in: 3600 }],
    ['no expires_in', { access_token: 'abc' }],
    ['a non-numeric expires_in', { access_token: 'abc', expires_in: 'soon' }],
  ])('rejects a response with %s', async (_label, body) => {
    fetchMock.mockResolvedValue(okResponse(body));

    await expect(requestAccessToken(CREDENTIALS)).rejects.toBeInstanceOf(TokenRequestError);
  });

  it('propagates a network failure rather than swallowing it', async () => {
    fetchMock.mockRejectedValue(new TypeError('network down'));

    await expect(requestAccessToken(CREDENTIALS)).rejects.toBeInstanceOf(TypeError);
  });
});
