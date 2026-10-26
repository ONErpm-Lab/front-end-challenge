/** Requests to this origin get the app token (the Spotify Web API); nothing else does. */
export const SPOTIFY_API_ORIGIN = 'https://api.spotify.com/';

/** Renew the token a bit early so it never expires in the middle of a search. */
export const TOKEN_EXPIRY_MARGIN_MS = 60_000;
