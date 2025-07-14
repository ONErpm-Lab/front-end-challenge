import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);
  const sessionToken = authService.getToken('token');

  if (req.url === `${environment.accountsUrl}/token`) {
    return next(req);
  }

  if (sessionToken) {
    const token: any = JSON.parse(sessionToken);
    const clonedRequest = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token.access_token}`)
    });
    return next(clonedRequest);
  }

  return next(req);
};
