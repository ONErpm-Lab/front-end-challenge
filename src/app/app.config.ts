import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { environment } from '../environments/environment';
import { provideI18n } from './core/i18n/provide-i18n';
import { spotifyAuthInterceptor } from './services/spotify-auth/spotify-auth.interceptor';
import { SPOTIFY_CREDENTIALS } from './services/spotify-auth/spotify-credentials';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withFetch(), withInterceptors([spotifyAuthInterceptor])),
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
    provideI18n(),
    { provide: SPOTIFY_CREDENTIALS, useValue: environment.spotify },
  ],
};
