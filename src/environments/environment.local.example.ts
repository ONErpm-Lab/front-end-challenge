import { Environment } from './environment.interfaces';

/**
 * Copy this file to `environment.local.ts` (ignored by Git) and fill in your Spotify app credentials.
 * `ng serve` (`npm start`) uses it in place of `environment.ts`.
 */
export const environment: Environment = {
  production: false,
  spotify: {
    clientId: 'YOUR_SPOTIFY_CLIENT_ID',
    clientSecret: 'YOUR_SPOTIFY_CLIENT_SECRET',
  },
};
