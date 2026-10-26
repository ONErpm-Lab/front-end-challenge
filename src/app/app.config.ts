import { provideHttpClient, withFetch } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideI18n } from './core/i18n/provide-i18n';
import { provideTheme } from './core/theme/provide-theme';

import { routes } from './app.routes';
import {
  provideClientHydration,
  withEventReplay,
  withNoHttpTransferCache,
} from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withFetch()),
    provideI18n(),
    provideTheme(),
    // The store hands its own results to the browser (TransferState): the HTTP cache would carry them twice.
    provideClientHydration(withEventReplay(), withNoHttpTransferCache()),
  ],
};
