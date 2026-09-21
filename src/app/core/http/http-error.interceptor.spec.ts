import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import type { AppErrorKind } from '../errors/app-error';
import { httpErrorInterceptor } from './http-error.interceptor';

describe('httpErrorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([httpErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it.each<[number, AppErrorKind]>([
    [401, 'auth'],
    [403, 'auth'],
    [404, 'notFound'],
    [429, 'rateLimited'],
    [500, 'provider'],
    [503, 'provider'],
    [418, 'unknown'],
  ])('classifies HTTP %i as "%s"', async (status, kind) => {
    const promise = firstValueFrom(http.get('/x'));
    httpMock.expectOne('/x').flush('boom', { status, statusText: 'Error' });

    await expect(promise).rejects.toMatchObject({ kind });
  });

  it('classifies a failed connection as a network error', async () => {
    const promise = firstValueFrom(http.get('/x'));
    httpMock.expectOne('/x').error(new ProgressEvent('error'));

    await expect(promise).rejects.toMatchObject({ kind: 'network' });
  });

  it('gives every error a user-facing message and keeps the cause for logs', async () => {
    const promise = firstValueFrom(http.get('/x'));
    httpMock.expectOne('/x').flush('boom', { status: 503, statusText: 'Error' });

    await expect(promise).rejects.toMatchObject({
      message: expect.stringContaining('indisponível'),
      cause: expect.anything(),
    });
  });

  it('leaves successful responses untouched', async () => {
    const promise = firstValueFrom(http.get('/x'));
    httpMock.expectOne('/x').flush({ ok: true });

    await expect(promise).resolves.toEqual({ ok: true });
  });
});
