import { InjectionToken } from '@angular/core';

/**
 * Everything the app needs to know about its environment, in one place.
 *
 * Consumers inject the token, never `environment.ts` directly — that keeps the
 * dependency pointing at an abstraction (DIP) and lets any test swap the whole
 * configuration with a single provider override.
 */
export interface AppConfig {
  /** Base URL of the Spotify Web API. */
  readonly spotifyApiUrl: string;
  /** Same-origin endpoint of our token proxy. The client secret lives behind it. */
  readonly tokenEndpoint: string;
  /** Market used for the availability check required by the spec. */
  readonly targetMarket: string;
  /** How many ISRC lookups may be in flight at once. */
  readonly lookupConcurrency: number;
  /** Attempts for a retryable (429/5xx) request, first try included. */
  readonly maxRetries: number;
  /**
   * Serve tracks from local fixtures instead of calling Spotify.
   *
   * TODO(spotify-403): temporary. Spotify now returns 403 on every Web API endpoint
   * unless the app owner holds an active Premium subscription, which blocks all real
   * data. This lets the UI be built meanwhile. Set back to `false` everywhere — and
   * delete this flag — once real access works.
   */
  readonly useFixtures: boolean;
}

export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG');
