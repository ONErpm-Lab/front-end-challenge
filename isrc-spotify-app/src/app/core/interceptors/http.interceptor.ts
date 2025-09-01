import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { throwError } from 'rxjs';

export const httpInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  console.log('🔗 HTTP Interceptor: Interceptando requisição para:', req.url);

  // Não intercepta requisições para o token
  if (req.url === environment.SPOTIFY_TOKEN_URL) {
    console.log('🔗 HTTP Interceptor: Requisição para token, não interceptando');
    return next(req);
  }

  // Não intercepta requisições para arquivos i18n
  if (req.url.includes('/assets/i18n/')) {
    console.log('🔗 HTTP Interceptor: Requisição para arquivo i18n, não interceptando');
    return next(req);
  }

  // Adiciona token para requisições da API do Spotify
  if (req.url.includes('api.spotify.com')) {
    const token = sessionStorage.getItem('spotifyToken');
    console.log('🔗 HTTP Interceptor: Requisição para API Spotify, token encontrado:', !!token);

    if (token) {
      const authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`),
      });
      console.log('🔗 HTTP Interceptor: Adicionando header Authorization');
      return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
          // Intercepta erros HTTP
          if (error.status === 401) {
            console.log('🔗 HTTP Interceptor: Token expirado (401), limpando storage');
            // Token expirado, limpa o storage
            sessionStorage.removeItem('spotifyToken');
          }
          return throwError(() => error);
        })
      );
    } else {
      console.warn(
        '⚠️ HTTP Interceptor: Token não encontrado para API Spotify. A requisição pode falhar.'
      );
      // Continua com a requisição mesmo sem token para que o erro seja tratado pelo serviço
    }
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Intercepta erros para todas as outras requisições
      return throwError(() => error);
    })
  );
};
