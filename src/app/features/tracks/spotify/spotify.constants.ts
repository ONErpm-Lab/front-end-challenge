/** Spotify's official embedded player. Only this origin is ever put in an `<iframe src>`. */
export const SPOTIFY_EMBED_URL = 'https://open.spotify.com/embed/track';

/** Spotify's official iFrame API, which can start the embedded player by code. Loaded only after a click. */
export const SPOTIFY_IFRAME_API_URL = 'https://open.spotify.com/embed/iframe-api/v1';

/** How long to wait for Spotify's script before giving up on it and using the plain embed. */
export const SPOTIFY_IFRAME_API_TIMEOUT_MS = 10_000;

/**
 * How long the whole start of the player (script, embed and its "ready") may take before the plain embed takes
 * over: a stalled step must not leave the bar on its spinner for good.
 */
export const SPOTIFY_EMBED_READY_TIMEOUT_MS = 15_000;

/** What comes before the id in the address the iFrame API plays. */
export const SPOTIFY_TRACK_URI_PREFIX = 'spotify:track:';

/** Spotify track ids are 22 base-62 characters. Anything else is never turned into a URL. */
export const SPOTIFY_TRACK_ID_PATTERN = /^[A-Za-z0-9]{22}$/;

/**
 * The language tags Spotify's embed takes in `?locale=` (`en`, `es`, `pt-BR`...). Anything else is never put in a URL.
 * Note that the embed does not know a bare `pt`: it needs `pt-BR`.
 */
export const SPOTIFY_LOCALE_PATTERN = /^[A-Za-z]{2,3}(-[A-Za-z]{2})?$/;

/** Height of Spotify's slimmest player (cover, title, artist and play control): it fits a bar. */
export const SPOTIFY_EMBED_HEIGHT = 80;
