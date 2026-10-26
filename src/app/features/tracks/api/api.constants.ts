export const TRACKS_API_URL = '/api/tracks';
export const ISRC_QUERY_PARAM = 'isrc';

/** A hung BFF must surface as "unavailable" instead of an endless spinner. */
export const TRACKS_REQUEST_TIMEOUT_MS = 20_000;
/** On the server the page waits for the lookup before it answers, so it gives up sooner and lets the browser ask. */
export const TRACKS_SERVER_REQUEST_TIMEOUT_MS = 6_000;
