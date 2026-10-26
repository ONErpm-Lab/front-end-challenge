import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { SpotifyAuthError } from '../../api/spotify-accounts/spotify-auth-error';
import { spotifyAuthInterceptor } from './spotify-auth.interceptor';
import { SpotifyTokenService } from './spotify-token.service';

const SEARCH = 'https://api.spotify.com/v1/search';

function setup() {
  let issued = 1;
  const tokens = {
    get: vi.fn(async () => `token-${issued}`),
    invalidate: vi.fn(() => {
      issued++;
    }),
  };
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(withInterceptors([spotifyAuthInterceptor])),
      provideHttpClientTesting(),
      { provide: SpotifyTokenService, useValue: tokens },
    ],
  });
  return {
    http: TestBed.inject(HttpClient),
    backend: TestBed.inject(HttpTestingController),
    tokens,
  };
}

/** The interceptor waits for the token (a promise) before the request reaches the backend. */
const tick = () => new Promise((resolve) => setTimeout(resolve));

describe('spotifyAuthInterceptor', () => {
  it('sends the app token to the Spotify Web API', async () => {
    const { http, backend } = setup();

    const answer = firstValueFrom(http.get(SEARCH));
    await tick();
    const request = backend.expectOne(SEARCH);
    expect(request.request.headers.get('Authorization')).toBe('Bearer token-1');
    request.flush({ ok: true });

    await expect(answer).resolves.toEqual({ ok: true });
  });

  it('leaves every other request alone', async () => {
    const { http, backend, tokens } = setup();

    const answer = firstValueFrom(http.get('/i18n/en.json'));
    const request = backend.expectOne('/i18n/en.json');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});

    await answer;
    expect(tokens.get).not.toHaveBeenCalled();
  });

  it('renews a refused token and sends the request once more', async () => {
    const { http, backend, tokens } = setup();

    const answer = firstValueFrom(http.get(SEARCH));
    await tick();
    backend.expectOne(SEARCH).flush({}, { status: 401, statusText: 'Unauthorized' });
    await tick();
    const retry = backend.expectOne(SEARCH);
    expect(retry.request.headers.get('Authorization')).toBe('Bearer token-2');
    retry.flush({ ok: true });

    await expect(answer).resolves.toEqual({ ok: true });
    expect(tokens.invalidate).toHaveBeenCalledTimes(1);
  });

  it('gives up when the new token is refused too', async () => {
    const { http, backend } = setup();

    const answer = firstValueFrom(http.get(SEARCH));
    await tick();
    backend.expectOne(SEARCH).flush({}, { status: 401, statusText: 'Unauthorized' });
    await tick();
    backend.expectOne(SEARCH).flush({}, { status: 401, statusText: 'Unauthorized' });

    await expect(answer).rejects.toMatchObject({ status: 401 });
  });

  it('passes other errors on without retrying', async () => {
    const { http, backend } = setup();

    const answer = firstValueFrom(http.get(SEARCH));
    await tick();
    backend.expectOne(SEARCH).flush({}, { status: 500, statusText: 'Error' });

    await expect(answer).rejects.toMatchObject({ status: 500 });
    backend.verify();
  });

  it('fails without calling Spotify when there is no token', async () => {
    const { http, backend, tokens } = setup();
    tokens.get.mockRejectedValueOnce(new SpotifyAuthError('not configured'));

    await expect(firstValueFrom(http.get(SEARCH))).rejects.toBeInstanceOf(SpotifyAuthError);
    backend.expectNone(SEARCH);
  });
});
