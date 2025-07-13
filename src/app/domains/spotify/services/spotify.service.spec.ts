import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SpotifyService } from './spotify.service';
import { environment } from '../../../../environments/environment';
import { of } from 'rxjs';
import { provideZonelessChangeDetection } from '@angular/core';

describe('SpotifyService', () => {
  let service: SpotifyService;
  let httpMock: HttpTestingController;

  const mockTokenResponse = {
    access_token: 'mock_access_token',
    token_type: 'Bearer',
    expires_in: 3600
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SpotifyService,
        provideZonelessChangeDetection()
      ]
    });
    service = TestBed.inject(SpotifyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    service.clearTokenCache();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should request token only once when called multiple times simultaneously', () => {
    const firstCall$ = service.getToken();
    
    const secondCall$ = service.getToken();
    
    const thirdCall$ = service.getToken();

    firstCall$.subscribe(token => {
      expect(token).toBe('mock_access_token');
    });

    secondCall$.subscribe(token => {
      expect(token).toBe('mock_access_token');
    });

    thirdCall$.subscribe(token => {
      expect(token).toBe('mock_access_token');
    });

    const req = httpMock.expectOne(environment.spotify.endpoints.token);
    expect(req.request.method).toBe('POST');
    req.flush(mockTokenResponse);
  });

  it('should return cached token if valid and not expiring soon', () => {
    service.getToken().subscribe(token => {
      expect(token).toBe('mock_access_token');
    });

    const req = httpMock.expectOne(environment.spotify.endpoints.token);
    req.flush(mockTokenResponse);

    service.getToken().subscribe(token => {
      expect(token).toBe('mock_access_token');
    });

    httpMock.expectNone(environment.spotify.endpoints.token);
  });

  it('should request new token if current token is expired', () => {
    service.getToken().subscribe(token => {
      expect(token).toBe('mock_access_token');
    });

    const req1 = httpMock.expectOne(environment.spotify.endpoints.token);
    req1.flush(mockTokenResponse);

    service.clearTokenCache();

    service.getToken().subscribe(token => {
      expect(token).toBe('mock_access_token');
    });

    const req2 = httpMock.expectOne(environment.spotify.endpoints.token);
    req2.flush(mockTokenResponse);
  });

  it('should clear token cache correctly', () => {
    service.getToken().subscribe();
    const req = httpMock.expectOne(environment.spotify.endpoints.token);
    req.flush(mockTokenResponse);

    expect(service.hasToken()).toBe(true);
    expect(service.token()).toBe('mock_access_token');
    
    service.clearTokenCache();

    expect(service.hasToken()).toBe(false);
    expect(service.token()).toBe('');
  });

  it('should handle search requests with token', () => {
    const mockSearchResponse = {
      tracks: {
        items: []
      }
    };

    service.search('test query', 'track', 10).subscribe(response => {
      expect(response).toEqual(mockSearchResponse);
    });

    const tokenReq = httpMock.expectOne(environment.spotify.endpoints.token);
    tokenReq.flush(mockTokenResponse);

    const searchReq = httpMock.expectOne(`${environment.spotify.endpoints.search}?q=test%20query&type=track&limit=10`);
    expect(searchReq.request.headers.get('Authorization')).toBe('Bearer mock_access_token');
    searchReq.flush(mockSearchResponse);
  });
}); 