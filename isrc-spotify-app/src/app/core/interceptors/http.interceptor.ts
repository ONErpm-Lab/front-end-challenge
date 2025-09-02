import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';

export const httpInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  console.log('🔗 HTTP Interceptor: Interceptando requisição para:', req.url);

  // Não intercepta requisições para o token - permite que erros de credenciais cheguem ao guard
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
          return handleSpotifyError(error, req, next);
        })
      );
    } else {
      console.warn(
        '⚠️ HTTP Interceptor: Requisição para API Spotify sem token. Permitindo que o erro chegue ao componente.'
      );
      // Não tenta obter token automaticamente - deixa o erro chegar ao componente
      return next(req);
    }
  }

  // Para outras requisições, trata erros genéricos
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      return handleGenericError(error);
    })
  );
};

/**
 * Trata erros específicos da API do Spotify
 */
function handleSpotifyError(
  error: HttpErrorResponse,
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  console.log('🔗 HTTP Interceptor: Tratando erro Spotify:', error.status);

  switch (error.status) {
    case 401:
      console.log('🔗 HTTP Interceptor: Token expirado (401), limpando storage');
      sessionStorage.removeItem('spotifyToken');
      // Não tenta renovar token automaticamente - deixa o componente decidir
      return throwError(
        () =>
          new HttpErrorResponse({
            error: 'Token expirado. Faça login novamente.',
            status: 401,
            statusText: 'Unauthorized',
          })
      );

    case 403:
      console.log('🔗 HTTP Interceptor: Acesso negado (403)');
      return throwError(
        () =>
          new HttpErrorResponse({
            error: 'Acesso negado. Verifique suas credenciais.',
            status: 403,
            statusText: 'Forbidden',
          })
      );

    case 429:
      console.log('🔗 HTTP Interceptor: Rate limit excedido (429)');
      return throwError(
        () =>
          new HttpErrorResponse({
            error: 'Limite de requisições excedido. Aguarde um momento.',
            status: 429,
            statusText: 'Too Many Requests',
          })
      );

    case 500:
      console.log('🔗 HTTP Interceptor: Erro interno do servidor (500)');
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

/**
 * Trata erros genéricos
 */
function handleGenericError(error: HttpErrorResponse): Observable<HttpEvent<unknown>> {
  console.log('🔗 HTTP Interceptor: Tratando erro genérico:', error.status);

  // Personaliza mensagens de erro comuns
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
