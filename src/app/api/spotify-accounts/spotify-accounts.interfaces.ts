export interface SpotifyCredentials {
  readonly clientId: string;
  readonly clientSecret: string;
}

/** An app token: it reads the public catalog, nothing of any user. */
export interface SpotifyAppToken {
  readonly accessToken: string;
  /** Seconds until it expires, counted from the answer. */
  readonly expiresIn: number;
}

/** What Spotify answers at `POST /api/token`. */
export interface SpotifyTokenResponse {
  readonly access_token: string;
  readonly token_type: string;
  readonly expires_in: number;
}
