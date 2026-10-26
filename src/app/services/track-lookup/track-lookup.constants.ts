/** Availability is judged for Brazil only: Spotify flags `is_playable` for this market. */
export const BRAZIL_MARKET = 'BR';

/** Searches in flight at once: ten ISRCs (and their pages) must not all hit Spotify at the same moment. */
export const MAX_CONCURRENT_SEARCHES = 4;

/** An ISRC lives on a handful of releases; this caps paging at 50 tracks so a bad answer cannot loop. */
export const MAX_SEARCH_PAGES = 5;

/** Longer waits than this are not worth keeping the visitor waiting for: that ISRC fails instead. */
export const MAX_RATE_LIMIT_WAIT_MS = 5_000;
export const MAX_RATE_LIMIT_RETRIES = 1;

/** Cooldown to assume when a 429 comes without a usable `Retry-After`. */
export const DEFAULT_RETRY_AFTER_MS = 1_000;
