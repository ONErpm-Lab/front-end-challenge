import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { SPOTIFY_API_ORIGIN } from './spotify-auth.constants';
import { SpotifyTokenService } from './spotify-token.service';

/**
 * Puts the app token on every request to the Spotify Web API (`Authorization: Bearer …`). When Spotify refuses it
 * (401), the token is renewed and the request is sent once more. Requests to anywhere else pass untouched.
 */
export const spotifyAuthInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith(SPOTIFY_API_ORIGIN)) {
    return next(request);
  }
  const tokens = inject(SpotifyTokenService);
  const send = () => from(tokens.get()).pipe(switchMap((token) => next(withToken(request, token))));

  return send().pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        tokens.invalidate();
        return send();
      }
      return throwError(() => error);
    }),
  );
};

function withToken<T>(request: HttpRequest<T>, token: string): HttpRequest<T> {
  return request.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}
