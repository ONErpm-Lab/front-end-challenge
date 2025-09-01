import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export const httpInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  // Não intercepta requisições para o token
  if (req.url === environment.SPOTIFY_TOKEN_URL) {
    return next(req);
  }

  // Adiciona token para requisições da API do Spotify
  if (req.url.includes('api.spotify.com')) {
    const token = sessionStorage.getItem('spotifyToken');

    if (token) {
      const authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`),
      });
      return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
          // Intercepta erros HTTP
          if (error.status === 401) {
            // Token expirado, limpa o storage
            sessionStorage.removeItem('spotifyToken');
          }
          return throwError(() => error);
        })
      );
    }
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Intercepta erros para todas as outras requisições
      return throwError(() => error);
    })
  );
};
