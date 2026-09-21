import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { APP_CONFIG, type AppConfig } from '../config/app-config';
import { httpErrorInterceptor } from './http-error.interceptor';
import { spotifyAuthInterceptor } from './spotify-auth.interceptor';

const CONFIG: AppConfig = {
  spotifyApiUrl: 'https://api.spotify.com/v1',
  tokenEndpoint: '/api/spotify-token',
  targetMarket: 'BR',
  lookupConcurrency: 4,
  maxRetries: 1,
};

describe('spotifyAuthInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([spotifyAuthInterceptor, httpErrorInterceptor])),
        provideHttpClientTesting(),
        { provide: APP_CONFIG, useValue: CONFIG },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  const flushToken = (token = 'abc') =>
    httpMock.expectOne(CONFIG.tokenEndpoint).flush({ access_token: token, expires_in: 3600 });

  it('attaches the bearer token to Spotify requests', async () => {
    const promise = firstValueFrom(http.get(`${CONFIG.spotifyApiUrl}/search`));
    flushToken('abc');

    const request = httpMock.expectOne(`${CONFIG.spotifyApiUrl}/search`);
    expect(request.request.headers.get('Authorization')).toBe('Bearer abc');

    request.flush({});
    await promise;
  });

  it('leaves the token endpoint alone, or the token store would depend on itself', async () => {
    const promise = firstValueFrom(http.post(CONFIG.tokenEndpoint, null));
    const request = httpMock.expectOne(CONFIG.tokenEndpoint);

    expect(request.request.headers.has('Authorization')).toBe(false);

    request.flush({ access_token: 'abc', expires_in: 3600 });
    await promise;
  });

  it('does not authenticate requests to unrelated hosts', async () => {
    const promise = firstValueFrom(http.get('https://example.test/thing'));
    const request = httpMock.expectOne('https://example.test/thing');

    expect(request.request.headers.has('Authorization')).toBe(false);
    // No token was fetched at all.
    httpMock.expectNone(CONFIG.tokenEndpoint);

    request.flush({});
    await promise;
  });

  it('drops a rejected token so the next attempt re-authenticates', async () => {
    const failed = firstValueFrom(http.get(`${CONFIG.spotifyApiUrl}/search`));
    flushToken('stale');
    httpMock
      .expectOne(`${CONFIG.spotifyApiUrl}/search`)
      .flush('nope', { status: 401, statusText: 'Unauthorized' });
    await expect(failed).rejects.toMatchObject({ kind: 'auth' });

    // Had the stale token been kept, no second token request would appear here.
    const retried = firstValueFrom(http.get(`${CONFIG.spotifyApiUrl}/search`));
    flushToken('fresh');

    const request = httpMock.expectOne(`${CONFIG.spotifyApiUrl}/search`);
    expect(request.request.headers.get('Authorization')).toBe('Bearer fresh');

    request.flush({});
    await retried;
  });
});
