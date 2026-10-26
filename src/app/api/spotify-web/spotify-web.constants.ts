import { ReleaseDatePrecision } from '../../models/tracks.enums';

export const SPOTIFY_SEARCH_URL = 'https://api.spotify.com/v1/search';

/** Search `limit` is capped at 10 since the February 2026 API changes. */
export const SEARCH_LIMIT = 10;

/** A request to Spotify that hangs must surface as a failure, not an endless spinner. */
export const SPOTIFY_REQUEST_TIMEOUT_MS = 8_000;

/** Values Spotify may send in `release_date_precision`; anything else is a malformed payload. */
export const RELEASE_DATE_PRECISIONS: readonly unknown[] = Object.values(ReleaseDatePrecision);
