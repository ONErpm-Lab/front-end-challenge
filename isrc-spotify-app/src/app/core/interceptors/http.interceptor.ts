import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export const httpInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  // Adiciona token de autorização se for uma requisição para a API do Spotify
  if (request.url.includes('api.spotify.com') && environment.SPOTIFY_TOKEN) {
    request = request.clone({
      setHeaders: {
        Authorization: `Bearer ${environment.SPOTIFY_TOKEN}`,
      },
    });
  }

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Erro desconhecido';

      if (error.error instanceof ErrorEvent) {
        // Erro do cliente
        errorMessage = `Erro: ${error.error.message}`;
      } else {
        // Erro do servidor
        switch (error.status) {
          case 401:
            errorMessage = 'Token do Spotify inválido ou expirado';
            break;
          case 429:
            errorMessage = 'Limite de requisições excedido. Tente novamente em alguns minutos';
            break;
          case 500:
            errorMessage = 'Erro interno do servidor do Spotify';
            break;
          default:
            errorMessage = `Erro ${error.status}: ${error.message}`;
        }
      }

      console.error('Erro HTTP:', error);
      return throwError(() => new Error(errorMessage));
    })
  );
};
