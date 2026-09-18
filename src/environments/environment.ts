import type { AppConfig } from '../app/core/config/app-config';

/**
 * Production values.
 *
 * No secret ever belongs in this file — it is compiled into the browser bundle.
 * The Spotify client id/secret live only in the Cloudflare Pages Function.
 */
export const environment: AppConfig = {
  spotifyApiUrl: 'https://api.spotify.com/v1',
  tokenEndpoint: '/api/spotify-token',
  targetMarket: 'BR',
  lookupConcurrency: 4,
  maxRetries: 3,
};
