export const MAX_ISRCS_PER_REQUEST = 20;

/**
 * Browsers may reuse a response for a minute. A shared cache (the CDN in front of the function) keeps it for an hour,
 * serves it stale for a day while it asks again, and also when the server errors: it is what makes the instances of a
 * serverless function share one answer, which the in-memory cache of each of them cannot do. Only complete answers
 * get this (see the router).
 */
export const CACHE_CONTROL_PUBLIC =
  'public, max-age=60, s-maxage=3600, stale-while-revalidate=86400, stale-if-error=86400';
export const CACHE_CONTROL_NO_STORE = 'no-store';

/**
 * Server-side cache of resolved tracks. In memory only: nothing is persisted. A track's data barely changes,
 * and Spotify's rate limit can last an hour, so answers stay fresh for hours and may outlive that for a day
 * when Spotify cannot be reached.
 */
export const TRACK_CACHE_TTL_MS = 6 * 60 * 60_000;
export const TRACK_CACHE_STALE_IF_ERROR_MS = 24 * 60 * 60_000;
export const TRACK_CACHE_MAX_ENTRIES = 500;
