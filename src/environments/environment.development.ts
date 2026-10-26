import { Environment } from './environment.interfaces';

/**
 * Development build without credentials (unit tests, `ng build --configuration development`). To run the app
 * against Spotify, use `environment.local.ts` (see `environment.local.example.ts`).
 */
export const environment: Environment = {
  production: false,
  spotify: {
    clientId: '',
    clientSecret: '',
  },
};
