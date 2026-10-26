import { SpotifyFailureReason } from './spotify.enums';
import { SpotifyErrorDetails } from './spotify.interfaces';

/** The Spotify integration cannot serve the request (network, auth, rate limit, bad payload, missing config). */
export class SpotifyUnavailableError extends Error {
  public override readonly name = 'SpotifyUnavailableError';
  public readonly status?: number;
  public readonly retryAfterMs?: number;

  constructor(
    public readonly reason: SpotifyFailureReason,
    details: SpotifyErrorDetails = {},
  ) {
    const status = details.status ? ` (HTTP ${details.status})` : '';
    const wait =
      details.retryAfterMs === undefined
        ? ''
        : `, retry after ${Math.ceil(details.retryAfterMs / 1000)}s`;
    super(`Spotify integration unavailable: ${reason}${status}${wait}`, { cause: details.cause });
    this.status = details.status;
    this.retryAfterMs = details.retryAfterMs;
  }
}
