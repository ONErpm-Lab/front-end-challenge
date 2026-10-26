import { HttpClient, provideHttpClient } from '@angular/common/http';
import { throwError } from 'rxjs';
import { SpotifyAuthError } from '../spotify-accounts/spotify-auth-error';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SpotifyApiError } from './spotify-api-error';
import { SPOTIFY_REQUEST_TIMEOUT_MS } from './spotify-web.constants';
import { SpotifyApiFailure } from './spotify-web.enums';
import { SpotifySearchApiService } from './spotify-search-api.service';
import { spotifyTrack } from './testing/builders';

const QUERY = { isrc: 'BR1SP1200071', offset: 0 };

function setup() {
  TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
  return {
    api: TestBed.inject(SpotifySearchApiService),
    http: TestBed.inject(HttpTestingController),
  };
}

const search = (http: HttpTestingController) =>
  http.expectOne((request) => request.url === 'https://api.spotify.com/v1/search');

async function failure(promise: Promise<unknown>): Promise<SpotifyApiError> {
  const error = await promise.then(
    () => null,
    (cause: unknown) => cause,
  );
  expect(error).toBeInstanceOf(SpotifyApiError);
  return error as SpotifyApiError;
}

describe('SpotifyWebApi', () => {
  afterEach(() => vi.useRealTimers());

  it('searches the ISRC, a page of 10, and the market when given', async () => {
    const { api, http } = setup();

    const page = api.searchPage({ ...QUERY, market: 'BR', offset: 10 });
    const request = search(http);

    expect(request.request.params.get('q')).toBe('isrc:BR1SP1200071');
    expect(request.request.params.get('type')).toBe('track');
    expect(request.request.params.get('limit')).toBe('10');
    expect(request.request.params.get('offset')).toBe('10');
    expect(request.request.params.get('market')).toBe('BR');
    request.flush({ tracks: { items: [spotifyTrack()], next: 'https://api.spotify.com/next' } });

    await expect(page).resolves.toEqual({ items: [spotifyTrack()], hasNext: true });
  });

  it('leaves the market out when none is given, and sees the last page', async () => {
    const { api, http } = setup();

    const page = api.searchPage(QUERY);
    const request = search(http);
    expect(request.request.params.has('market')).toBe(false);
    request.flush({ tracks: { items: [], next: null } });

    await expect(page).resolves.toEqual({ items: [], hasNext: false });
  });

  it('reports an error status, with the wait Spotify asked for', async () => {
    const { api, http } = setup();

    const page = api.searchPage(QUERY);
    search(http).flush(
      {},
      { status: 429, statusText: 'Too Many', headers: { 'Retry-After': '3' } },
    );

    const error = await failure(page);
    expect(error).toMatchObject({
      failure: SpotifyApiFailure.HTTP,
      status: 429,
      retryAfterMs: 3000,
    });
  });

  it('ignores a Retry-After it cannot read', async () => {
    const { api, http } = setup();

    const page = api.searchPage(QUERY);
    search(http).flush(
      {},
      { status: 429, statusText: 'Too Many', headers: { 'Retry-After': 'soon' } },
    );

    expect((await failure(page)).retryAfterMs).toBeUndefined();
  });

  it('reports a network failure', async () => {
    const { api, http } = setup();

    const page = api.searchPage(QUERY);
    search(http).error(new ProgressEvent('error'));

    expect((await failure(page)).failure).toBe(SpotifyApiFailure.NETWORK);
  });

  it('gives up on a request that never answers', async () => {
    vi.useFakeTimers();
    const { api, http } = setup();

    const page = api.searchPage(QUERY);
    const request = search(http);
    const result = failure(page);
    vi.advanceTimersByTime(SPOTIFY_REQUEST_TIMEOUT_MS + 1);

    expect((await result).failure).toBe(SpotifyApiFailure.NETWORK);
    expect(request.cancelled).toBe(true);
  });

  it.each([
    ['no tracks object', {}],
    ['items that are not a list', { tracks: { items: 'x', next: null } }],
    ['a track without the fields the app reads', { tracks: { items: [{ id: 'x' }], next: null } }],
  ])('rejects an answer with %s as malformed', async (_label, body) => {
    const { api, http } = setup();

    const page = api.searchPage(QUERY);
    search(http).flush(body);

    expect((await failure(page)).failure).toBe(SpotifyApiFailure.MALFORMED);
  });

  it('rejects a body that is not JSON as malformed', async () => {
    const { api, http } = setup();

    const page = api.searchPage(QUERY);
    search(http).flush('<html>', { status: 200, statusText: 'OK' });

    expect((await failure(page)).failure).toBe(SpotifyApiFailure.MALFORMED);
  });

  it('passes on, as it is, a failure that is not an answer from Spotify', async () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: HttpClient,
          useValue: { get: () => throwError(() => new SpotifyAuthError('no token')) },
        },
      ],
    });

    await expect(TestBed.inject(SpotifySearchApiService).searchPage(QUERY)).rejects.toBeInstanceOf(
      SpotifyAuthError,
    );
  });
});
