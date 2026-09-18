import type { AppConfig } from '../app/core/config/app-config';

/** Development values. Served through `proxy.conf.json` -> `wrangler pages dev`. */
export const environment: AppConfig = {
  spotifyApiUrl: 'https://api.spotify.com/v1',
  tokenEndpoint: '/api/spotify-token',
  targetMarket: 'BR',
  lookupConcurrency: 4,
  maxRetries: 3,
  useFixtures: true,
};
