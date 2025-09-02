import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { TracksService } from './tracks.service';
import { SpotifyAuthService } from '../../../core/spotify/spotify-auth.service';
import { ITrack } from '../models';
import { ISRCCodes } from '../../../core/models';
import { environment } from '../../../../environments/environment';

describe('TracksService', () => {
  let service: TracksService;
  let httpMock: HttpTestingController;
  let spotifyAuthService: jasmine.SpyObj<SpotifyAuthService>;

  const mockToken = 'mock-spotify-token';
  const mockISRC = 'USUM71703861';

  const mockSpotifyTrack = {
    id: 'track-123',
    name: 'Test Song',
    artists: [
      {
        id: 'artist-123',
        name: 'Test Artist',
        external_urls: { spotify: 'https://spotify.com/artist/123' },
      },
    ],
    album: {
      id: 'album-123',
      name: 'Test Album',
      images: [{ url: 'https://example.com/image.jpg', height: 300, width: 300 }],
      release_date: '2023-01-01',
      release_date_precision: 'day',
      external_urls: { spotify: 'https://spotify.com/album/123' },
    },
    duration_ms: 180000,
    preview_url: 'https://example.com/preview.mp3',
    external_urls: { spotify: 'https://spotify.com/track/123' },
    available_markets: ['US', 'BR', 'CA'],
  };

  const mockTrack: ITrack = {
    id: 'track-123',
    name: 'Test Song',
    artists: [
      {
        id: 'artist-123',
        name: 'Test Artist',
        external_urls: { spotify: 'https://spotify.com/artist/123' },
      },
    ],
    album: {
      id: 'album-123',
      name: 'Test Album',
      images: [{ url: 'https://example.com/image.jpg', height: 300, width: 300 }],
      release_date: '2023-01-01',
      release_date_precision: 'day',
      external_urls: { spotify: 'https://spotify.com/album/123' },
    },
    duration_ms: 180000,
    preview_url: 'https://example.com/preview.mp3',
    external_urls: { spotify: 'https://spotify.com/track/123' },
    available_markets: ['US', 'BR', 'CA'],
    isrc: mockISRC,
  };

  beforeEach(() => {
    const spotifyAuthSpy = jasmine.createSpyObj('SpotifyAuthService', ['getToken']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TracksService, { provide: SpotifyAuthService, useValue: spotifyAuthSpy }],
    });

    service = TestBed.inject(TracksService);
    httpMock = TestBed.inject(HttpTestingController);
    spotifyAuthService = TestBed.inject(SpotifyAuthService) as jasmine.SpyObj<SpotifyAuthService>;

    // Mock console para evitar logs nos testes
    spyOn(console, 'log');
    spyOn(console, 'error');
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Inicialização', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with empty data', () => {
      service.data$.subscribe((tracks) => {
        expect(tracks).toEqual([]);
      });
    });

    it('should initialize with loading false', () => {
      service.loading$.subscribe((loading) => {
        expect(loading).toBeFalse();
      });
    });

    it('should initialize with no error', () => {
      service.error$.subscribe((error) => {
        expect(error).toBeNull();
      });
    });
  });

  describe('loadAllTracks', () => {
    beforeEach(() => {
      spotifyAuthService.getToken.and.returnValue(of(mockToken));
    });

    it('should load all tracks successfully', () => {
      const mockResponse = {
        tracks: {
          items: [mockSpotifyTrack],
        },
      };

      service.loadAllTracks().subscribe((tracks) => {
        expect(tracks.length).toBe(1);
        expect(tracks[0]).toEqual(
          jasmine.objectContaining({
            id: mockTrack.id,
            name: mockTrack.name,
            isrc: jasmine.any(String),
          })
        );
      });

      // Espera uma requisição para cada ISRC code
      const isrcCodes = Object.values(ISRCCodes);
      const requests = httpMock.match((req) =>
        req.url.includes(`${environment.SPOTIFY_API_URL}/search`)
      );

      expect(requests.length).toBe(isrcCodes.length);

      // Responde apenas para a primeira requisição com dados
      requests[0].flush(mockResponse);

      // Responde com vazio para as outras
      for (let i = 1; i < requests.length; i++) {
        requests[i].flush({ tracks: { items: [] } });
      }

      expect(spotifyAuthService.getToken).toHaveBeenCalled();
    });

    it('should handle empty responses', () => {
      service.loadAllTracks().subscribe((tracks) => {
        expect(tracks).toEqual([]);
      });

      const requests = httpMock.match((req) =>
        req.url.includes(`${environment.SPOTIFY_API_URL}/search`)
      );

      // Responde com vazio para todas as requisições
      requests.forEach((req) => {
        req.flush({ tracks: { items: [] } });
      });
    });

    it('should handle HTTP errors', (done) => {
      let errorReceived: string | null = null;
      let tracksReceived: ITrack[] = [];

      service.loadAllTracks().subscribe((tracks) => {
        tracksReceived = tracks;
      });

      service.error$.subscribe((error) => {
        errorReceived = error;
        if (error) {
          expect(tracksReceived).toEqual([]);
          // Como o interceptor não trata mais erros, o erro deve ser propagado normalmente
          expect(errorReceived).toBeTruthy();
          done();
        }
      });

      const requests = httpMock.match((req) =>
        req.url.includes(`${environment.SPOTIFY_API_URL}/search`)
      );

      // Simula erro na primeira requisição
      requests[0].error(new ErrorEvent('Network error'));

      // Completa as outras requisições
      for (let i = 1; i < requests.length; i++) {
        requests[i].flush({ tracks: { items: [] } });
      }
    });

    it('should handle auth service error', () => {
      spotifyAuthService.getToken.and.returnValue(throwError(() => new Error('Auth failed')));

      let errorReceived: string | null = null;
      let tracksReceived: ITrack[] = [];

      service.loadAllTracks().subscribe({
        next: (tracks) => {
          tracksReceived = tracks;
        },
        error: (error) => {
          // Erro pode ser capturado aqui também
        },
      });

      service.error$.subscribe((error) => {
        errorReceived = error;
      });

      expect(tracksReceived).toEqual([]);
    });

    it('should set loading state correctly', () => {
      const loadingStates: boolean[] = [];

      service.loading$.subscribe((loading) => {
        loadingStates.push(loading);
      });

      service.loadAllTracks().subscribe();

      const requests = httpMock.match((req) =>
        req.url.includes(`${environment.SPOTIFY_API_URL}/search`)
      );

      requests.forEach((req) => {
        req.flush({ tracks: { items: [] } });
      });

      expect(loadingStates).toContain(true); // Loading started
      expect(loadingStates).toContain(false); // Loading finished
    });
  });

  describe('searchTrackByISRC', () => {
    beforeEach(() => {
      spotifyAuthService.getToken.and.returnValue(of(mockToken));
    });

    it('should search track by ISRC successfully', () => {
      const mockResponse = {
        tracks: {
          items: [mockSpotifyTrack],
        },
      };

      service.searchTrackByISRC(mockISRC).subscribe((track) => {
        expect(track).toBeTruthy();
        expect(track?.isrc).toBe(mockISRC);
        expect(track?.name).toBe(mockSpotifyTrack.name);
      });

      const req = httpMock.expectOne(
        (request) =>
          request.url.includes(`${environment.SPOTIFY_API_URL}/search`) &&
          request.params.get('q') === `isrc:${mockISRC}`
      );

      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('type')).toBe('track');
      expect(req.request.params.get('include_external')).toBe('audio');
      req.flush(mockResponse);
    });

    it('should return null when no track found', () => {
      service.searchTrackByISRC(mockISRC).subscribe((track) => {
        expect(track).toBeNull();
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes(`${environment.SPOTIFY_API_URL}/search`)
      );

      req.flush({ tracks: { items: [] } });
    });

    it('should handle HTTP errors gracefully', () => {
      service.searchTrackByISRC(mockISRC).subscribe((track) => {
        expect(track).toBeNull();
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes(`${environment.SPOTIFY_API_URL}/search`)
      );

      req.error(new ErrorEvent('Network error'));
    });

    it('should handle malformed responses', () => {
      service.searchTrackByISRC(mockISRC).subscribe((track) => {
        expect(track).toBeNull();
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes(`${environment.SPOTIFY_API_URL}/search`)
      );

      req.flush({ invalid: 'response' });
    });
  });

  describe('reloadTracks', () => {
    it('should call loadAllTracks', () => {
      spyOn(service, 'loadAllTracks').and.returnValue(of([]));

      service.reloadTracks().subscribe();

      expect(service.loadAllTracks).toHaveBeenCalled();
    });
  });

  describe('getTracksByAvailability', () => {
    beforeEach(() => {
      // Mock dos dados do serviço usando setData
      service.setData([
        { ...mockTrack, available_markets: ['US', 'BR'] },
        { ...mockTrack, id: 'track-456', available_markets: ['US', 'CA'] },
      ]);
    });

    it('should filter tracks available in BR', () => {
      service.getTracksByAvailability(true).subscribe((tracks) => {
        expect(tracks.length).toBe(1);
        expect(tracks[0].available_markets).toContain('BR');
      });
    });

    it('should filter tracks not available in BR', () => {
      service.getTracksByAvailability(false).subscribe((tracks) => {
        expect(tracks.length).toBe(1);
        expect(tracks[0].available_markets).not.toContain('BR');
      });
    });
  });

  describe('getTracksByArtist', () => {
    beforeEach(() => {
      service.setData([
        mockTrack,
        {
          ...mockTrack,
          id: 'track-456',
          artists: [
            {
              id: 'artist-456',
              name: 'Another Artist',
              external_urls: {
                spotify: '',
              },
            },
          ],
        },
      ]);
    });

    it('should filter tracks by artist name', () => {
      service.getTracksByArtist('Test Artist').subscribe((tracks) => {
        expect(tracks.length).toBe(1);
        expect(tracks[0].artists[0].name).toBe('Test Artist');
      });
    });

    it('should be case insensitive', () => {
      service.getTracksByArtist('test artist').subscribe((tracks) => {
        expect(tracks.length).toBe(1);
      });
    });

    it('should handle partial matches', () => {
      service.getTracksByArtist('Test').subscribe((tracks) => {
        expect(tracks.length).toBe(1);
      });
    });
  });

  describe('searchTracksByTerm', () => {
    beforeEach(() => {
      service.setData([mockTrack]);
      spotifyAuthService.getToken.and.returnValue(of(mockToken));
    });

    it('should return all tracks for empty search term', () => {
      service.searchTracksByTerm('').subscribe((tracks) => {
        expect(tracks.length).toBe(1);
      });
    });

    it('should return all tracks for whitespace search term', () => {
      service.searchTracksByTerm('   ').subscribe((tracks) => {
        expect(tracks.length).toBe(1);
      });
    });

    it('should search by ISRC format and call API', () => {
      const isrcTerm = 'USUM71703861';
      const mockResponse = { tracks: { items: [mockSpotifyTrack] } };

      service.searchTracksByTerm(isrcTerm).subscribe((tracks) => {
        expect(tracks.length).toBe(1);
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes(`${environment.SPOTIFY_API_URL}/search`)
      );
      req.flush(mockResponse);
    });

    it('should filter locally by track name', () => {
      service.searchTracksByTerm('Test Song').subscribe((tracks) => {
        expect(tracks.length).toBe(1);
        expect(tracks[0].name).toBe('Test Song');
      });
    });

    it('should filter locally by artist name', () => {
      service.searchTracksByTerm('Test Artist').subscribe((tracks) => {
        expect(tracks.length).toBe(1);
      });
    });

    it('should filter locally by album name', () => {
      service.searchTracksByTerm('Test Album').subscribe((tracks) => {
        expect(tracks.length).toBe(1);
      });
    });

    it('should be case insensitive for local search', () => {
      service.searchTracksByTerm('test song').subscribe((tracks) => {
        expect(tracks.length).toBe(1);
      });
    });

    it('should return empty array for no matches', () => {
      service.searchTracksByTerm('Non-existent').subscribe((tracks) => {
        expect(tracks.length).toBe(0);
      });
    });
  });

  describe('ISRC format validation', () => {
    beforeEach(() => {
      spotifyAuthService.getToken.and.returnValue(of(mockToken));
    });

    it('should recognize valid ISRC formats', () => {
      const validISRCs = ['USUM71703861', 'GBUM71505078', 'USRC17607839'];

      validISRCs.forEach((isrc) => {
        // Testa indiretamente através do searchTracksByTerm
        service.searchTracksByTerm(isrc).subscribe();

        httpMock
          .expectOne((request) => request.url.includes(`${environment.SPOTIFY_API_URL}/search`))
          .flush({ tracks: { items: [] } });
      });
    });

    it('should not recognize invalid ISRC formats as API calls', () => {
      service.setData([mockTrack]);

      const invalidISRCs = ['invalid', '123456', 'TOOLONG123456789'];

      invalidISRCs.forEach((term) => {
        service.searchTracksByTerm(term).subscribe((tracks) => {
          // Deve fazer busca local, não API
          expect(tracks).toBeDefined();
        });
      });

      // Não deve haver requisições HTTP para termos inválidos
      httpMock.expectNone((request) =>
        request.url.includes(`${environment.SPOTIFY_API_URL}/search`)
      );
    });
  });

  describe('Error handling', () => {
    it('should clear errors', (done) => {
      service.setError('Test error');

      let errorHistory: (string | null)[] = [];

      service.error$.subscribe((error) => {
        errorHistory.push(error);
        if (errorHistory.length === 2) {
          expect(errorHistory[0]).toBe('Test error');
          expect(errorHistory[1]).toBeNull();
          done();
        }
      });

      service.clearError();
    });

    it('should handle network errors with user-friendly messages', fakeAsync(() => {
      spotifyAuthService.getToken.and.returnValue(of(mockToken));

      let errorReceived: string | null = null;

      service.error$.subscribe((error) => {
        errorReceived = error;
      });

      service.loadAllTracks().subscribe();

      const requests = httpMock.match((req) =>
        req.url.includes(`${environment.SPOTIFY_API_URL}/search`)
      );

      // Simula erro na primeira requisição
      requests[0].error(new ErrorEvent('Network error'));

      // Completa as outras
      for (let i = 1; i < requests.length; i++) {
        requests[i].flush({ tracks: { items: [] } });
      }

      tick(); // avança o tempo e deixa os observables completarem

      // Como o interceptor não trata mais erros, o erro deve ser propagado normalmente
      expect(errorReceived).toBeTruthy();
    }));
  });

  describe('Data mapping', () => {
    it('should correctly map Spotify track to internal model', () => {
      spotifyAuthService.getToken.and.returnValue(of(mockToken));

      const mockResponse = {
        tracks: {
          items: [mockSpotifyTrack],
        },
      };

      service.searchTrackByISRC(mockISRC).subscribe((track) => {
        expect(track).toBeTruthy();
        expect(track?.id).toBe(mockSpotifyTrack.id);
        expect(track?.name).toBe(mockSpotifyTrack.name);
        expect(track?.duration_ms).toBe(mockSpotifyTrack.duration_ms);
        expect(track?.preview_url).toBe(mockSpotifyTrack.preview_url);
        expect(track?.available_markets).toEqual(mockSpotifyTrack.available_markets);
        expect(track?.isrc).toBe(mockISRC);
        expect(track?.artists[0].name).toBe(mockSpotifyTrack.artists[0].name);
        expect(track?.album.name).toBe(mockSpotifyTrack.album.name);
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes(`${environment.SPOTIFY_API_URL}/search`)
      );
      req.flush(mockResponse);
    });

    it('should handle tracks without preview URL', () => {
      spotifyAuthService.getToken.and.returnValue(of(mockToken));

      const trackWithoutPreview = {
        ...mockSpotifyTrack,
        preview_url: null,
      };

      const mockResponse = {
        tracks: {
          items: [trackWithoutPreview],
        },
      };

      service.searchTrackByISRC(mockISRC).subscribe((track) => {
        expect(track?.preview_url).toBeNull();
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes(`${environment.SPOTIFY_API_URL}/search`)
      );
      req.flush(mockResponse);
    });
  });
});
