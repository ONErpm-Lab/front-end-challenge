/** Spotify's official iFrame API, which can start the embedded player by code. Loaded only after a click. */
export const SPOTIFY_IFRAME_API_URL = 'https://open.spotify.com/embed/iframe-api/v1';

/** How long to wait for Spotify's script before giving up on it and using the plain embed. */
export const SPOTIFY_IFRAME_API_TIMEOUT_MS = 10_000;
