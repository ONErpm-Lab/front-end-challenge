/** Spotify gave no app token: missing or refused credentials, network, or an unexpected answer. */
export class SpotifyAuthError extends Error {
  public override readonly name = 'SpotifyAuthError';

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}
