import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { TokenStore } from '../auth/token-store';
import { APP_CONFIG } from '../config/app-config';
import { isAppErrorOfKind } from '../errors/app-error';

/**
 * Attaches the bearer token to Spotify calls, and only to Spotify calls.
 *
 * Requests to our own token endpoint are passed straight through — intercepting
 * them would make {@link TokenStore} depend on itself.
 */
export const spotifyAuthInterceptor: HttpInterceptorFn = (request, next) => {
  const config = inject(APP_CONFIG);

  if (!request.url.startsWith(config.spotifyApiUrl)) {
    return next(request);
  }

  const tokenStore = inject(TokenStore);

  return tokenStore.token().pipe(
    switchMap((token) => next(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }))),
    catchError((error: unknown) => {
      // A rejected token is usually a stale one; drop it so the next attempt renews.
      if (isAppErrorOfKind(error, 'auth')) {
        tokenStore.invalidate();
      }
      return throwError(() => error);
    }),
  );
};
