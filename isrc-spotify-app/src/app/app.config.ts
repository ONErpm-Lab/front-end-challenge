import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
  APP_INITIALIZER,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { httpInterceptor } from './core';
import { I18nService } from './core/services/i18n.service';
import { SpotifyAuthService } from './core/spotify/spotify-auth.service';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';

// Factory function para inicializar i18n
export function initializeI18n(i18nService: I18nService) {
  return () => {
    return i18nService.changeLanguage(i18nService.currentLanguage());
  };
}

// Factory function para inicializar Spotify
export function initializeSpotify(spotifyAuthService: SpotifyAuthService) {
  return () => {
    return spotifyAuthService.generateToken();
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([httpInterceptor])),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeI18n,
      deps: [I18nService],
      multi: true,
    },
  ],
};
