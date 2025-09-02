import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  HttpClientTestingModule,
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { httpInterceptor } from './http.interceptor';
import { SpotifyAuthService } from '../spotify/spotify-auth.service';

describe('HttpInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let spotifyAuthService: jasmine.SpyObj<SpotifyAuthService>;

  // URLs de teste
  const SPOTIFY_API_URL = 'https://api.spotify.com/v1/search';
  const I18N_URL = '/assets/i18n/pt.json';
  const TOKEN_URL = process.env['SPOTIFY_TOKEN_URL'];
  const GENERIC_URL = 'https://example.com/api/data';

  beforeEach(() => {
    const spotifyAuthSpy = jasmine.createSpyObj('SpotifyAuthService', ['getToken']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([httpInterceptor])),
        provideHttpClientTesting(),
        { provide: SpotifyAuthService, useValue: spotifyAuthSpy },
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    spotifyAuthService = TestBed.inject(SpotifyAuthService) as jasmine.SpyObj<SpotifyAuthService>;

    // Limpar sessionStorage antes de cada teste
    sessionStorage.clear();

    // Mock console methods para evitar logs nos testes
    spyOn(console, 'log');
    spyOn(console, 'warn');
    spyOn(console, 'error');
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
  });

  describe('Requisições não interceptadas', () => {
    it('should not intercept token requests', () => {
      const testData = { access_token: 'test-token' };

      httpClient.post(TOKEN_URL, {}).subscribe((response) => {
        expect(response).toEqual(testData);
      });

      const req = httpMock.expectOne(TOKEN_URL);
      expect(req.request.headers.has('Authorization')).toBeFalse();
      req.flush(testData);
    });

    it('should not intercept i18n asset requests', () => {
      const testData = { 'common.welcome': 'Bem-vindo' };

      httpClient.get(I18N_URL).subscribe((response) => {
        expect(response).toEqual(testData);
      });

      const req = httpMock.expectOne(I18N_URL);
      expect(req.request.headers.has('Authorization')).toBeFalse();
      req.flush(testData);
    });

    it('should not intercept other i18n files', () => {
      const i18nEnUrl = '/assets/i18n/en.json';
      const testData = { 'common.welcome': 'Welcome' };

      httpClient.get(i18nEnUrl).subscribe((response) => {
        expect(response).toEqual(testData);
      });

      const req = httpMock.expectOne(i18nEnUrl);
      expect(req.request.headers.has('Authorization')).toBeFalse();
      req.flush(testData);
    });
  });

  describe('Requisições para API do Spotify com token', () => {
    const mockToken = 'mock-spotify-token';

    beforeEach(() => {
      sessionStorage.setItem('spotifyToken', mockToken);
    });

    it('should add Authorization header to Spotify API requests', () => {
      const testData = { tracks: { items: [] } };

      httpClient.get(SPOTIFY_API_URL).subscribe((response) => {
        expect(response).toEqual(testData);
      });

      const req = httpMock.expectOne(SPOTIFY_API_URL);
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush(testData);
    });

    it('should handle successful Spotify API responses', () => {
      const testData = { tracks: { items: [{ name: 'Test Song' }] } };

      httpClient.get(SPOTIFY_API_URL).subscribe((response) => {
        expect(response).toEqual(testData);
      });

      const req = httpMock.expectOne(SPOTIFY_API_URL);
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush(testData);
    });
  });

  describe('Requisições para API do Spotify sem token', () => {
    it('should not add Authorization header when no token is available', () => {
      const testData = { tracks: { items: [] } };

      httpClient.get(SPOTIFY_API_URL).subscribe((response) => {
        expect(response).toEqual(testData);
      });

      const req = httpMock.expectOne(SPOTIFY_API_URL);
      expect(req.request.headers.has('Authorization')).toBeFalse();
      req.flush(testData);
    });

    it('should log warning when no token is available', () => {
      const testData = { tracks: { items: [] } };

      httpClient.get(SPOTIFY_API_URL).subscribe((response) => {
        expect(response).toEqual(testData);
      });

      const req = httpMock.expectOne(SPOTIFY_API_URL);
      req.flush(testData);

      expect(console.warn).toHaveBeenCalledWith(
        '⚠️ HTTP Interceptor: Requisição para API Spotify sem token. Permitindo que o erro chegue ao componente.'
      );
    });
  });

  describe('Tratamento de erros genéricos', () => {
    it('should handle network errors (status 0)', () => {
      httpClient.get(GENERIC_URL).subscribe({
        next: () => fail('Should have failed'),
        error: (error: HttpErrorResponse) => {
          expect(error.status).toBe(0);
          expect(error.error).toBe('Erro de conexão. Verifique sua internet.');
        },
      });

      const req = httpMock.expectOne(GENERIC_URL);
      req.flush(null, { status: 0, statusText: 'Network Error' });
    });

    it('should handle 404 Not Found errors', () => {
      httpClient.get(GENERIC_URL).subscribe({
        next: () => fail('Should have failed'),
        error: (error: HttpErrorResponse) => {
          expect(error.status).toBe(404);
          expect(error.error).toBe('Recurso não encontrado.');
        },
      });

      const req = httpMock.expectOne(GENERIC_URL);
      req.flush(null, { status: 404, statusText: 'Not Found' });
    });

    it('should pass through other generic errors unchanged', () => {
      const originalError = { message: 'Some other error' };

      httpClient.get(GENERIC_URL).subscribe({
        next: () => fail('Should have failed'),
        error: (error: HttpErrorResponse) => {
          expect(error.status).toBe(503);
          expect(error.error).toEqual(originalError);
        },
      });

      const req = httpMock.expectOne(GENERIC_URL);
      req.flush(originalError, { status: 503, statusText: 'Service Unavailable' });
    });
  });

  describe('Logging', () => {
    it('should log intercepted requests', () => {
      sessionStorage.setItem('spotifyToken', 'test-token');

      httpClient.get(SPOTIFY_API_URL).subscribe();

      const req = httpMock.expectOne(SPOTIFY_API_URL);
      req.flush({});

      expect(console.log).toHaveBeenCalledWith(
        '🔗 HTTP Interceptor: Interceptando requisição para:',
        SPOTIFY_API_URL
      );
      expect(console.log).toHaveBeenCalledWith(
        '🔗 HTTP Interceptor: Requisição para API Spotify, token encontrado:',
        true
      );
    });

    it('should log non-intercepted requests', () => {
      httpClient.get(I18N_URL).subscribe();

      const req = httpMock.expectOne(I18N_URL);
      req.flush({});

      expect(console.log).toHaveBeenCalledWith(
        '🔗 HTTP Interceptor: Interceptando requisição para:',
        I18N_URL
      );
      expect(console.log).toHaveBeenCalledWith(
        '🔗 HTTP Interceptor: Requisição para arquivo i18n, não interceptando'
      );
    });

    it('should log token requests as non-intercepted', () => {
      httpClient.post(TOKEN_URL, {}).subscribe();

      const req = httpMock.expectOne(TOKEN_URL);
      req.flush({});

      expect(console.log).toHaveBeenCalledWith(
        '🔗 HTTP Interceptor: Interceptando requisição para:',
        TOKEN_URL
      );
      expect(console.log).toHaveBeenCalledWith(
        '🔗 HTTP Interceptor: Requisição para token, não interceptando'
      );
    });
  });
});
