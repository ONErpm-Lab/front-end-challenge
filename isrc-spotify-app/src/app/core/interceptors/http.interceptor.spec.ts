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
import { environment } from '../../../environments/environment';

describe('HttpInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let spotifyAuthService: jasmine.SpyObj<SpotifyAuthService>;

  // URLs de teste
  const SPOTIFY_API_URL = 'https://api.spotify.com/v1/search';
  const I18N_URL = '/assets/i18n/pt.json';
  const TOKEN_URL = environment.SPOTIFY_TOKEN_URL;
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

  describe('Tratamento de erros específicos do Spotify', () => {
    const mockToken = 'mock-spotify-token';

    beforeEach(() => {
      sessionStorage.setItem('spotifyToken', mockToken);
    });

    it('should handle 401 Unauthorized error by clearing token and trying to get new one', fakeAsync(() => {
      const newToken = 'new-mock-token';
      spotifyAuthService.getToken.and.callFake(() => {
        sessionStorage.setItem('spotifyToken', newToken);
        return of(newToken);
      });

      const testData = { tracks: { items: [] } };

      httpClient.get(SPOTIFY_API_URL).subscribe((response) => {
        expect(response).toEqual(testData);
      });

      const req1 = httpMock.expectOne(SPOTIFY_API_URL);
      req1.flush(null, { status: 401, statusText: 'Unauthorized' });

      tick(); // 🔑 dispara o retry

      const req2 = httpMock.expectOne(SPOTIFY_API_URL);
      expect(req2.request.headers.get('Authorization')).toBe(`Bearer ${newToken}`);
      req2.flush(testData);

      expect(spotifyAuthService.getToken).toHaveBeenCalled();
    }));

    it('should handle 403 Forbidden error', () => {
      httpClient.get(SPOTIFY_API_URL).subscribe({
        next: () => fail('Should have failed with 403'),
        error: (error: HttpErrorResponse) => {
          expect(error.status).toBe(403);
          expect(error.error).toBe('Acesso negado. Verifique suas credenciais.');
        },
      });

      const req = httpMock.expectOne(SPOTIFY_API_URL);
      req.flush(null, { status: 403, statusText: 'Forbidden' });
    });

    it('should handle 429 Rate Limit error', () => {
      httpClient.get(SPOTIFY_API_URL).subscribe({
        next: () => fail('Should have failed with 429'),
        error: (error: HttpErrorResponse) => {
          expect(error.status).toBe(429);
          expect(error.error).toBe('Limite de requisições excedido. Aguarde um momento.');
        },
      });

      const req = httpMock.expectOne(SPOTIFY_API_URL);
      req.flush(null, { status: 429, statusText: 'Too Many Requests' });
    });

    it('should handle 500 Internal Server Error', () => {
      httpClient.get(SPOTIFY_API_URL).subscribe({
        next: () => fail('Should have failed with 500'),
        error: (error: HttpErrorResponse) => {
          expect(error.status).toBe(500);
          expect(error.error).toBe('Erro interno do servidor. Tente novamente mais tarde.');
        },
      });

      const req = httpMock.expectOne(SPOTIFY_API_URL);
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });
    });

    it('should pass through other Spotify errors unchanged', () => {
      const originalError = { message: 'Custom error' };

      httpClient.get(SPOTIFY_API_URL).subscribe({
        next: () => fail('Should have failed'),
        error: (error: HttpErrorResponse) => {
          expect(error.status).toBe(418);
          expect(error.error).toEqual(originalError);
        },
      });

      const req = httpMock.expectOne(SPOTIFY_API_URL);
      req.flush(originalError, { status: 418, statusText: "I'm a teapot" });
    });
  });

  describe('Casos sem token disponível', () => {
    it('should try to get new token when no token is available', () => {
      const newToken = 'new-token';
      const testData = { tracks: { items: [] } };

      // Mock do serviço de auth para retornar sucesso
      spotifyAuthService.getToken.and.callFake(() => {
        sessionStorage.setItem('spotifyToken', newToken);
        return of(newToken);
      });

      httpClient.get(SPOTIFY_API_URL).subscribe((response) => {
        expect(response).toEqual(testData);
      });

      // Deve fazer a requisição com o novo token
      const req = httpMock.expectOne(SPOTIFY_API_URL);
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${newToken}`);
      req.flush(testData);

      expect(spotifyAuthService.getToken).toHaveBeenCalled();
    });

    it('should handle failure to get new token', () => {
      spotifyAuthService.getToken.and.returnValue(throwError(() => new Error('Auth failed')));

      httpClient.get(SPOTIFY_API_URL).subscribe({
        next: () => fail('Should have failed'),
        error: (error: HttpErrorResponse) => {
          expect(error.status).toBe(401);
          expect(error.error).toBe('Erro de autenticação. Verifique suas credenciais.');
        },
      });

      expect(spotifyAuthService.getToken).toHaveBeenCalled();
    });

    it('should handle case where new token is not stored after auth service call', () => {
      // Auth service retorna sucesso mas não armazena token no sessionStorage
      spotifyAuthService.getToken.and.returnValue(of('token-not-stored'));

      httpClient.get(SPOTIFY_API_URL).subscribe({
        next: () => fail('Should have failed'),
        error: (error: HttpErrorResponse) => {
          expect(error.status).toBe(401);
          expect(error.error).toBe('Erro de autenticação. Verifique suas credenciais.');
        },
      });

      expect(spotifyAuthService.getToken).toHaveBeenCalled();
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

  describe('Integração completa', () => {
    it('should handle complete flow: no token -> get token -> retry request', () => {
      const newToken = 'integration-test-token';
      const testData = { result: 'success' };

      // Simula obtenção de token
      spotifyAuthService.getToken.and.callFake(() => {
        sessionStorage.setItem('spotifyToken', newToken);
        return of(newToken);
      });

      httpClient.get(SPOTIFY_API_URL).subscribe((response) => {
        expect(response).toEqual(testData);
      });

      // Verifica a requisição final com token
      const req = httpMock.expectOne(SPOTIFY_API_URL);
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${newToken}`);
      req.flush(testData);

      expect(spotifyAuthService.getToken).toHaveBeenCalled();
    });

    it('should handle token refresh on 401 and successful retry', fakeAsync(() => {
      const oldToken = 'expired-token';
      const newToken = 'refreshed-token';
      const testData = { refreshed: true };

      sessionStorage.setItem('spotifyToken', oldToken);

      // Mock do refresh de token
      spotifyAuthService.getToken.and.callFake(() => {
        sessionStorage.setItem('spotifyToken', newToken);
        return of(newToken);
      });

      httpClient.get(SPOTIFY_API_URL).subscribe((response) => {
        expect(response).toEqual(testData);
      });

      // Primeira requisição com token expirado
      const req1 = httpMock.expectOne(SPOTIFY_API_URL);
      expect(req1.request.headers.get('Authorization')).toBe(`Bearer ${oldToken}`);
      req1.flush(null, { status: 401, statusText: 'Unauthorized' });

      tick(); // Dispara o retry

      // Segunda requisição com token renovado
      const req2 = httpMock.expectOne(SPOTIFY_API_URL);
      expect(req2.request.headers.get('Authorization')).toBe(`Bearer ${newToken}`);
      req2.flush(testData);

      expect(spotifyAuthService.getToken).toHaveBeenCalled();
    }));
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

    it('should log missing token warnings', () => {
      httpClient.get(SPOTIFY_API_URL).subscribe();

      // Como não há token, deve tentar obter um novo
      expect(console.warn).toHaveBeenCalledWith(
        '⚠️ HTTP Interceptor: Requisição para API Spotify sem token. Tentando obter novo token...'
      );
    });
  });
});
