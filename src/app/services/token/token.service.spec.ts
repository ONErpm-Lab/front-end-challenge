import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { TokenService } from './token.service';

fdescribe('TokenService', () => {
  let service: TokenService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TokenService]
    });
    service = TestBed.inject(TokenService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call getAccessToken and return token data', () => {
    const mockTokenResponse = {
      access_token: 'mock_access_token',
      token_type: 'Bearer',
      expires_in: 3600
    };

    service.getAccessToken().subscribe(response => {
      expect(response).toEqual(mockTokenResponse);
    });

    const req = httpMock.expectOne(`${environment.accountsUrl}/token`);
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Content-Type')).toBe('application/x-www-form-urlencoded');
    expect(req.request.headers.get('Authorization')).toContain('Basic ');
    expect(req.request.body).toBe('grant_type=client_credentials');

    req.flush(mockTokenResponse);
  });

  it('should handle error response', () => {
    service.getAccessToken().subscribe({
      next: () => fail('Should have failed with error'),
      error: (error) => {
        expect(error.status).toBe(401);
      }
    });

    const req = httpMock.expectOne(`${environment.accountsUrl}/token`);
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
  });

  it('should encode client credentials correctly', () => {
    const expectedCredentials = btoa('57c21d30e79c44d39415a4fc0a157afa:eb21c7b523af4c47bfa94835e84527c5');

    service.getAccessToken().subscribe();

    const req = httpMock.expectOne(`${environment.accountsUrl}/token`);
    expect(req.request.headers.get('Authorization')).toBe(`Basic ${expectedCredentials}`);

    req.flush({});
  });
});