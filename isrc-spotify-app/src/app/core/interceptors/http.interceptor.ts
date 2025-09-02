import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

import { catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';

export const httpInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  if (req.url === process.env['SPOTIFY_TOKEN_URL']) {
    return next(req);
  }

  if (req.url.includes('/assets/i18n/')) {
    return next(req);
  }

  if (req.url.includes('api.spotify.com')) {
    const token = sessionStorage.getItem('spotifyToken');

    if (token) {
      const authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`),
      });
      return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
          return handleSpotifyError(error, req, next);
        })
      );
    } else {
      return next(req);
    }
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      return handleGenericError(error);
    })
  );
};

function handleSpotifyError(
  error: HttpErrorResponse,
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  switch (error.status) {
    case 401:
      sessionStorage.removeItem('spotifyToken');
      return throwError(
        () =>
          new HttpErrorResponse({
            error: 'Token expirado. Faça login novamente.',
            status: 401,
            statusText: 'Unauthorized',
          })
      );

    case 403:
      return throwError(
        () =>
          new HttpErrorResponse({
            error: 'Acesso negado. Verifique suas credenciais.',
            status: 403,
            statusText: 'Forbidden',
          })
      );

    case 429:
      return throwError(
        () =>
          new HttpErrorResponse({
            error: 'Limite de requisições excedido. Aguarde um momento.',
            status: 429,
            statusText: 'Too Many Requests',
          })
      );

    case 500:
      return throwError(
        () =>
          new HttpErrorResponse({
            error: 'Erro interno do servidor. Tente novamente mais tarde.',
            status: 500,
            statusText: 'Internal Server Error',
          })
      );

    default:
      return throwError(() => error);
  }
}

function handleGenericError(error: HttpErrorResponse): Observable<HttpEvent<unknown>> {
  switch (error.status) {
    case 0:
      return throwError(
        () =>
          new HttpErrorResponse({
            error: 'Erro de conexão. Verifique sua internet.',
            status: 0,
            statusText: 'Network Error',
          })
      );

    case 404:
      return throwError(
        () =>
          new HttpErrorResponse({
            error: 'Recurso não encontrado.',
            status: 404,
            statusText: 'Not Found',
          })
      );

    default:
      return throwError(() => error);
  }
}
