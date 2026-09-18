import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
  type TestRequest,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { APP_CONFIG, type AppConfig } from '../../../core/config/app-config';
import { httpErrorInterceptor } from '../../../core/http/http-error.interceptor';
import { TrackRepository } from '../domain/track-repository';
import { spotifyTrackDto } from '../testing/track.fixtures';
import { SpotifyTrackRepository } from './spotify-track.repository';

const CONFIG: AppConfig = {
  spotifyApiUrl: 'https://api.spotify.com/v1',
  tokenEndpoint: '/api/spotify-token',
  targetMarket: 'BR',
  lookupConcurrency: 4,
  // Retries off: this suite is about request shape and error classification, and
  // backoff timers would only make it slow and flaky.
  maxRetries: 1,
};

describe('SpotifyTrackRepository', () => {
  let repository: TrackRepository;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([httpErrorInterceptor])),
        provideHttpClientTesting(),
        { provide: APP_CONFIG, useValue: CONFIG },
        { provide: TrackRepository, useClass: SpotifyTrackRepository },
      ],
    });

    repository = TestBed.inject(TrackRepository);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  const expectSearch = (isrc: string): TestRequest =>
    httpMock.expectOne(
      (request) =>
        request.url === `${CONFIG.spotifyApiUrl}/search` &&
        request.params.get('q') === `isrc:${isrc}`,
    );

  it('queries Spotify once per ISRC using the isrc: search filter', async () => {
    const promise = firstValueFrom(repository.findByIsrcs(['AAA', 'BBB']));

    expectSearch('AAA').flush({ tracks: { items: [spotifyTrackDto({ name: 'A' })] } });
    expectSearch('BBB').flush({ tracks: { items: [spotifyTrackDto({ name: 'B' })] } });

    expect((await promise).map((t) => t.title).sort()).toEqual(['A', 'B']);
  });

  it('never sends a market param, because it would strip available_markets', async () => {
    const promise = firstValueFrom(repository.findByIsrcs(['AAA']));
    const request = expectSearch('AAA');

    expect(request.request.params.has('market')).toBe(false);

    request.flush({ tracks: { items: [spotifyTrackDto()] } });
    await promise;
  });

  it('omits codes that resolve to no track instead of failing the batch', async () => {
    const promise = firstValueFrom(repository.findByIsrcs(['AAA', 'BBB']));

    expectSearch('AAA').flush({ tracks: { items: [] } });
    expectSearch('BBB').flush({ tracks: { items: [spotifyTrackDto({ name: 'B' })] } });

    expect((await promise).map((t) => t.title)).toEqual(['B']);
  });

  it('omits a code the provider reports as 404', async () => {
    const promise = firstValueFrom(repository.findByIsrcs(['AAA', 'BBB']));

    expectSearch('AAA').flush('missing', { status: 404, statusText: 'Not Found' });
    expectSearch('BBB').flush({ tracks: { items: [spotifyTrackDto({ name: 'B' })] } });

    expect((await promise).map((t) => t.title)).toEqual(['B']);
  });

  it('propagates a provider outage so the page can raise the required alert', async () => {
    const promise = firstValueFrom(repository.findByIsrcs(['AAA']));

    expectSearch('AAA').flush('boom', { status: 503, statusText: 'Service Unavailable' });

    await expect(promise).rejects.toMatchObject({ kind: 'provider' });
  });

  it('propagates a network failure', async () => {
    const promise = firstValueFrom(repository.findByIsrcs(['AAA']));

    expectSearch('AAA').error(new ProgressEvent('error'));

    await expect(promise).rejects.toMatchObject({ kind: 'network' });
  });

  it('emits an empty list when given no codes, without calling the provider', async () => {
    await expect(firstValueFrom(repository.findByIsrcs([]))).resolves.toEqual([]);
  });
});
