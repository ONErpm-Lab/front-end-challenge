import {
  HttpClient,
  HttpErrorResponse,
  HttpInterceptorFn,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { catchError } from 'rxjs';
import { accessTokenMock } from '../../tests/mocks/access-token.mock';
import { endpoints } from '../endpoints';
import { tokenInterceptor } from './token.interceptor';
import { TokenService } from './token.service';

describe('tokenInterceptor', () => {
  const interceptor: HttpInterceptorFn = (req, next) =>
    TestBed.runInInjectionContext(() => tokenInterceptor(req, next));

  let httpTestingController: HttpTestingController;
  let tokenService: jasmine.SpyObj<TokenService>;
  let httpClient: HttpClient;

  beforeEach(() => {
    tokenService = jasmine.createSpyObj('TokenService', ['getToken']);
    tokenService.getToken.and.returnValue(accessTokenMock);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([tokenInterceptor])),
        provideHttpClientTesting(),
        { provide: TokenService, useValue: tokenService },
      ],
    });

    httpTestingController = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });

  it(`should return the original req if the 
    url intercepted is present in the skippedURLs array`, () => {
    const url = endpoints.accessToken;
    httpClient.get(url).subscribe();

    const req = httpTestingController.expectOne(url);

    expect(req.request.headers.get('Authorization')).toBeNull();
  });

  it('should add Authorization headers with the Bearer token', () => {
    const url = '/mockendpoint';
    httpClient.get(url).subscribe();

    const req = httpTestingController.expectOne(url);

    expect(req.request.headers.get('Authorization')).toEqual(
      `Bearer ${accessTokenMock.access_token}`
    );
  });

  it(`should catch 401 error from a HttpErrorResponse instace`, () => {
    const url = '/mockendpoint';
    const testData = { message: 'Error message' };

    httpClient
      .get(url)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          expect(error.status).toEqual(401);
          expect(error.error).toEqual(testData);
          return [];
        })
      )
      .subscribe();

    const req1 = httpTestingController.expectOne(url);
    req1.flush(testData, { status: 401, statusText: 'Unauthorized request' });
  });

  it(`should catch generic error from a HttpErrorResponse instace`, () => {
    const url = '/mockendpoint';
    const testData = { message: 'Error message' };

    httpClient
      .get(url)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          expect(error.status).toEqual(500);
          expect(error.error).toEqual(testData);
          return [];
        })
      )
      .subscribe();

    const req1 = httpTestingController.expectOne(url);
    req1.flush(testData, { status: 500, statusText: 'Internal Server Error' });
  });
});
