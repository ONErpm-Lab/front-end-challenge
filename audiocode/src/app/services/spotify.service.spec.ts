/// <reference types="jasmine" />

import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { SpotifyService } from './spotify.service';

describe('SpotifyService', () => {
  let service: SpotifyService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SpotifyService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(SpotifyService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should authenticate and map a track returned by Spotify', async () => {
    const resultPromise = firstValueFrom(service.searchTrackByIsrc('ABC123'));

    const tokenRequest = httpTesting.expectOne('https://accounts.spotify.com/api/token');
    expect(tokenRequest.request.method).toBe('POST');
    tokenRequest.flush({ access_token: 'token', token_type: 'Bearer', expires_in: 3600 });

    const searchRequest = httpTesting.expectOne((request) =>
      request.url === 'https://api.spotify.com/v1/search' &&
      request.params.get('q') === 'isrc:ABC123' &&
      request.params.get('type') === 'track' &&
      request.params.get('market') === 'BR'
    );
    expect(searchRequest.request.headers.get('Authorization')).toBe('Bearer token');
    searchRequest.flush({
      tracks: {
        items: [{
          id: 'track-id',
          name: 'Test Track',
          album: { images: [{ url: 'cover.jpg' }], release_date: '2024-03-25' },
          artists: [{ name: 'Test Artist' }],
          duration_ms: 125000,
          preview_url: 'preview.mp3',
          external_urls: { spotify: 'https://spotify.test/track' },
          external_ids: { isrc: 'ABC123' },
          available_markets: ['BR']
        }]
      }
    });

    await expectAsync(resultPromise).toBeResolvedTo(jasmine.objectContaining({
      isrc: 'ABC123',
      title: 'Test Track',
      artists: ['Test Artist'],
      durationFormated: '02:05',
      availableInBR: true
    }));
  });

  it('should return null when Spotify search fails', async () => {
    const resultPromise = firstValueFrom(service.searchTrackByIsrc('ABC123'));

    httpTesting.expectOne('https://accounts.spotify.com/api/token')
      .flush({ access_token: 'token', token_type: 'Bearer', expires_in: 3600 });
    httpTesting.expectOne((request) => request.url === 'https://api.spotify.com/v1/search')
      .error(new ErrorEvent('Network error'));

    await expectAsync(resultPromise).toBeResolvedTo(null);
  });
});
