import { ReleaseDatePrecision } from '../../contract/tracks.enums';

export const TOKEN_URL = 'https://accounts.spotify.com/api/token';
export const SEARCH_URL = 'https://api.spotify.com/v1/search';

/** Search `limit` is capped at 10 since the February 2026 API changes. */
export const SEARCH_LIMIT = 10;

/** Simultaneous searches allowed against Spotify across all visitors (shared limiter). */
export const MAX_CONCURRENT_SEARCHES = 5;

/** An ISRC lives on a handful of releases; this caps paging at 50 tracks so a bad query cannot loop. */
export const MAX_SEARCH_PAGES = 5;
export const REQUEST_TIMEOUT_MS = 8_000;

/** Renew the token a bit early so it never expires mid-request. */
export const TOKEN_EXPIRY_MARGIN_MS = 60_000;

/** Longer waits are not worth holding a user request open for: fail fast instead. */
export const MAX_RATE_LIMIT_WAIT_MS = 5_000;
export const MAX_RATE_LIMIT_RETRIES = 1;

/** Cooldown to assume when a 429 arrives without a usable `Retry-After`. */
export const DEFAULT_RETRY_AFTER_MS = 1_000;

/** Values Spotify may send in `release_date_precision`; anything else is a malformed payload. */
export const RELEASE_DATE_PRECISIONS: readonly unknown[] = Object.values(ReleaseDatePrecision);
