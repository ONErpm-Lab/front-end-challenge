/** Why a call to the Spotify Web API did not give a usable answer. */
export enum SpotifyApiFailure {
  /** Spotify answered with an error status (`status` says which: 401, 429, 5xx…). */
  HTTP = 'http',
  /** No answer: offline, blocked, or it took longer than the timeout. */
  NETWORK = 'network',
  /** An answer that does not have the shape the app reads. */
  MALFORMED = 'malformed',
}
