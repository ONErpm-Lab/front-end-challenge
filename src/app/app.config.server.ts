import {
  ApplicationConfig,
  CSP_NONCE,
  REQUEST_CONTEXT,
  inject,
  mergeApplicationConfig,
} from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    // The nonce of this request (see `server.ts`): the inline scripts that Angular writes carry it.
    {
      provide: CSP_NONCE,
      useFactory: () =>
        (inject(REQUEST_CONTEXT, { optional: true }) as { nonce?: string } | null)?.nonce ?? null,
    },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
