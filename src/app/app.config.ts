import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { APP_CONFIG } from './core/config/app-config';
import { httpErrorInterceptor } from './core/http/http-error.interceptor';
import { spotifyAuthInterceptor } from './core/http/spotify-auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),

    // Order matters: auth runs first so it can attach the token and react to a 401,
    // and the error interceptor sits closest to the network so it sees every failure.
    provideHttpClient(withInterceptors([spotifyAuthInterceptor, httpErrorInterceptor])),

    // Components depend on this token, never on `environment` directly.
    { provide: APP_CONFIG, useValue: environment },
  ],
};
