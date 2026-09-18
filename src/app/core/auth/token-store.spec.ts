import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { APP_CONFIG, type AppConfig } from '../config/app-config';
import { httpErrorInterceptor } from '../http/http-error.interceptor';
import { TokenStore } from './token-store';

const CONFIG: AppConfig = {
  spotifyApiUrl: 'https://api.spotify.com/v1',
  tokenEndpoint: '/api/spotify-token',
  targetMarket: 'BR',
  lookupConcurrency: 4,
  maxRetries: 1,
  useFixtures: false,
};

describe('TokenStore', () => {
  let store: TokenStore;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([httpErrorInterceptor])),
        provideHttpClientTesting(),
        { provide: APP_CONFIG, useValue: CONFIG },
      ],
    });

    store = TestBed.inject(TokenStore);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  const flushToken = (token = 'abc', expiresIn = 3600) =>
    httpMock
      .expectOne(CONFIG.tokenEndpoint)
      .flush({ access_token: token, expires_in: expiresIn, token_type: 'Bearer' });

  it('fetches a token from our own proxy, never from Spotify directly', async () => {
    const promise = firstValueFrom(store.token());
    const request = httpMock.expectOne(CONFIG.tokenEndpoint);

    expect(request.request.method).toBe('POST');

    request.flush({ access_token: 'abc', expires_in: 3600 });
    await expect(promise).resolves.toBe('abc');
  });

  it('reuses a cached token instead of re-authenticating', async () => {
    const first = firstValueFrom(store.token());
    flushToken('abc');
    await first;

    // Ten parallel ISRC lookups must cost one token request, not ten.
    await expect(firstValueFrom(store.token())).resolves.toBe('abc');
    httpMock.expectNone(CONFIG.tokenEndpoint);
  });

  it('re-authenticates after invalidate()', async () => {
    const first = firstValueFrom(store.token());
    flushToken('first');
    await first;

    store.invalidate();

    const second = firstValueFrom(store.token());
    flushToken('second');
    await expect(second).resolves.toBe('second');
  });

  it('treats a token that is already within the expiry skew as unusable', async () => {
    const first = firstValueFrom(store.token());
    // 10s lifetime is inside the 30s renewal skew, so it must never be cached.
    flushToken('short-lived', 10);
    await first;

    const second = firstValueFrom(store.token());
    flushToken('fresh');
    await expect(second).resolves.toBe('fresh');
  });

  it('does not cache a failed request as the permanent in-flight one', async () => {
    const failed = firstValueFrom(store.token());
    httpMock.expectOne(CONFIG.tokenEndpoint).flush('down', { status: 503, statusText: 'Error' });
    await expect(failed).rejects.toMatchObject({ kind: 'provider' });

    const retried = firstValueFrom(store.token());
    flushToken('recovered');
    await expect(retried).resolves.toBe('recovered');
  });

  it('rejects a malformed token response', async () => {
    const promise = firstValueFrom(store.token());
    httpMock.expectOne(CONFIG.tokenEndpoint).flush({ expires_in: 3600 });

    await expect(promise).rejects.toMatchObject({ kind: 'auth' });
  });
});
