import { SpotifyApiFailure } from './spotify-web.enums';

/** A failed call to the Spotify Web API, with what the caller needs to decide to retry. */
export class SpotifyApiError extends Error {
  public override readonly name = 'SpotifyApiError';

  constructor(
    public readonly failure: SpotifyApiFailure,
    /** HTTP status for `HTTP` failures. */
    public readonly status?: number,
    /** How long Spotify asked to wait (`Retry-After`), in milliseconds, when it said so. */
    public readonly retryAfterMs?: number,
    options?: ErrorOptions,
  ) {
    super(`Spotify Web API call failed: ${failure}${status ? ` (HTTP ${status})` : ''}`, options);
  }
}
