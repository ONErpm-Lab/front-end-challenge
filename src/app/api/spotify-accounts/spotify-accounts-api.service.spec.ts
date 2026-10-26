import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  TestRequest,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SpotifyAccountsApiService } from './spotify-accounts-api.service';
import { SpotifyAuthError } from './spotify-auth-error';
import { TOKEN_REQUEST_TIMEOUT_MS } from './spotify-accounts.constants';

const CREDENTIALS = { clientId: 'my-id', clientSecret: 'my-secret' };

function setup() {
  TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
  return {
    api: TestBed.inject(SpotifyAccountsApiService),
    http: TestBed.inject(HttpTestingController),
  };
}

const tokenRequest = (http: HttpTestingController) =>
  http.expectOne('https://accounts.spotify.com/api/token');

describe('SpotifyAccountsApiService', () => {
  afterEach(() => vi.useRealTimers());

  it('asks Spotify for an app token with the credentials, as HTTP Basic', async () => {
    const { api, http } = setup();

    const token = api.requestAppToken(CREDENTIALS);
    const request = tokenRequest(http);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toBe('grant_type=client_credentials');
    expect(request.request.headers.get('Authorization')).toBe(`Basic ${btoa('my-id:my-secret')}`);
    expect(request.request.headers.get('Content-Type')).toBe('application/x-www-form-urlencoded');
    request.flush({ access_token: 'abc', token_type: 'Bearer', expires_in: 3600 });

    await expect(token).resolves.toEqual({ accessToken: 'abc', expiresIn: 3600 });
  });

  it('fails without calling Spotify when the credentials are not configured', async () => {
    const { api, http } = setup();

    await expect(api.requestAppToken({ clientId: '', clientSecret: '' })).rejects.toBeInstanceOf(
      SpotifyAuthError,
    );
    http.expectNone('https://accounts.spotify.com/api/token');
  });

  type Answer = (request: TestRequest) => void;
  it.each<[string, Answer]>([
    ['refused credentials', (request) => request.flush({}, { status: 400, statusText: 'Bad' })],
    ['a network failure', (request) => request.error(new ProgressEvent('error'))],
    ['an answer without a token', (request) => request.flush({ expires_in: 3600 })],
    ['an answer without a lifetime', (request) => request.flush({ access_token: 'abc' })],
  ])('fails on %s', async (_label, answer) => {
    const { api, http } = setup();

    const token = api.requestAppToken(CREDENTIALS);
    answer(tokenRequest(http));

    await expect(token).rejects.toBeInstanceOf(SpotifyAuthError);
  });

  it('gives up when Spotify does not answer in time', async () => {
    vi.useFakeTimers();
    const { api, http } = setup();

    const token = api.requestAppToken(CREDENTIALS);
    tokenRequest(http);
    const failed = expect(token).rejects.toBeInstanceOf(SpotifyAuthError);
    vi.advanceTimersByTime(TOKEN_REQUEST_TIMEOUT_MS + 1);

    await failed;
  });
});
