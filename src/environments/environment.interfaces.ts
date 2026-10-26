export interface Environment {
  readonly production: boolean;
  /** Spotify app credentials (Client Credentials flow), from https://developer.spotify.com/dashboard. */
  readonly spotify: {
    readonly clientId: string;
    readonly clientSecret: string;
  };
}
