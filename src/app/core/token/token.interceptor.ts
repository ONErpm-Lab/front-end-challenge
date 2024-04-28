import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { endpoints } from '../endpoints';
import { TokenService } from './token.service';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const skippedURLs = [endpoints.accessToken];

  if (skippedURLs.includes(req.url)) {
    return next(req);
  }

  const tokenService = inject(TokenService);
  const authToken = tokenService.getToken()?.access_token;

  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  return next(authReq).pipe(
    catchError((err) => {
      if (err instanceof HttpErrorResponse) {
        if (err.status === 401) {
          console.error('Unauthorized request:', err);
        } else {
          console.error('HTTP error:', err);
        }
      }

      return throwError(() => err);
    })
  );
};
