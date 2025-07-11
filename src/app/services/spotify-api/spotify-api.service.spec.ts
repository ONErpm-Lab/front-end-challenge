import { SpotifyApiService } from './spotify-api.service';
import { HttpClient } from '@angular/common/http';
import { HttpParams, HttpHeaders } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { SpotifyAuthService } from '../spotify-auth/spotify-auth.service';
import { environment } from '../../../environments/environment';

describe('SpotifyApiService (Isolated)', () => {
  let service: SpotifyApiService;
  let httpClientSpy: jasmine.SpyObj<HttpClient>;
  let spotifyAuthServiceSpy: jasmine.SpyObj<SpotifyAuthService>;

  beforeEach(() => {
    httpClientSpy = jasmine.createSpyObj('HttpClient', ['request']);
    spotifyAuthServiceSpy = jasmine.createSpyObj('SpotifyAuthService', ['getValidAccessToken']);

    service = new SpotifyApiService(httpClientSpy, spotifyAuthServiceSpy);
    environment.apiBaseUrl = 'https://api.spotify.com/v1';
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('searchTracksByIsrc', () => {
    const mockAccessToken = 'mock_access_token';
    const mockSpotifyResponse = {
      tracks: {
        items: [
          {
            album: {
              images: [{ url: 'album_thumb_url' }],
              release_date: '2023-01-01',
            },
            name: 'Track Title 1',
            artists: [{ name: 'Artist 1' }, { name: 'Artist 2' }],
            duration_ms: 180000, // 3 minutes
            preview_url: 'preview_url_1',
            external_urls: { spotify: 'spotify_page_link_1' },
            available_markets: ['US', 'BR'],
          },
          {
            album: {
              images: [{ url: 'album_thumb_url_2' }],
              release_date: '2022-05-15',
            },
            name: 'Track Title 2',
            artists: [{ name: 'Artist 3' }],
            duration_ms: 245000, // 4 minutes 5 seconds
            preview_url: 'preview_url_2',
            external_urls: { spotify: 'spotify_page_link_2' },
            available_markets: ['US'],
          },
        ],
      },
    };

    const expectedFormattedTracks = [
      {
        albumThumb: 'album_thumb_url',
        releaseDate: '2023-01-01',
        trackTitle: 'Track Title 1',
        artists: 'Artist 1, Artist 2',
        duration: '3:00',
        audioPreviewUrl: 'preview_url_1',
        spotifyPageLink: 'spotify_page_link_1',
        availableInBrazil: true,
      },
      {
        albumThumb: 'album_thumb_url_2',
        releaseDate: '2022-05-15',
        trackTitle: 'Track Title 2',
        artists: 'Artist 3',
        duration: '4:05',
        audioPreviewUrl: 'preview_url_2',
        spotifyPageLink: 'spotify_page_link_2',
        availableInBrazil: false,
      },
    ];

    beforeEach(() => {
      spotifyAuthServiceSpy.getValidAccessToken.and.returnValue(of(mockAccessToken));
    });

    it('should return formatted tracks when search is successful', (done) => {
      httpClientSpy.request.and.returnValue(of(mockSpotifyResponse));

      service.searchTracksByIsrc('test query').subscribe(tracks => {
        expect(tracks).toEqual(expectedFormattedTracks as any);
        expect(spotifyAuthServiceSpy.getValidAccessToken).toHaveBeenCalledTimes(1);
        expect(httpClientSpy.request).toHaveBeenCalledWith(
          'GET',
          `${environment.apiBaseUrl}/search`,
          jasmine.objectContaining({
            params: jasmine.any(HttpParams),
            headers: jasmine.any(HttpHeaders)
          })
        );
        done();
      });
    });

    it('should return null if no tracks are found in the response', (done) => {
      const emptyResponse = { tracks: { items: [] } };
      httpClientSpy.request.and.returnValue(of(emptyResponse));

      service.searchTracksByIsrc('nonexistent query').subscribe(tracks => {
        expect(tracks).toBeNull();
        done();
      });
    });

    it('should return null if response.tracks is null or undefined', (done) => {
      const noTracksFieldResponse = {};
      httpClientSpy.request.and.returnValue(of(noTracksFieldResponse));

      service.searchTracksByIsrc('query').subscribe(tracks => {
        expect(tracks).toBeNull();
        done();
      });
    });

    it('should handle API errors gracefully', (done) => {
      const errorMessage = 'Spotify API Error';
      httpClientSpy.request.and.returnValue(throwError(() => new Error(errorMessage)));

      service.searchTracksByIsrc('error query').subscribe({
        next: () => fail('should have errored'),
        error: (error) => {
          expect(error.message).toContain('Spotify API request failed for /search');
          expect(error.message).toContain(errorMessage);
          done();
        }
      });
    });

    it('should throw an error if access token is not available', (done) => {
      spotifyAuthServiceSpy.getValidAccessToken.and.returnValue(of(null) as any);

      service.searchTracksByIsrc('query without token').subscribe({
        next: () => fail('should have errored'),
        error: (error) => {
          expect(error.message).toContain('SpotifyApiService: Access Token is not available.');
          expect(httpClientSpy.request).not.toHaveBeenCalled();
          done();
        }
      });
    });
  });
});