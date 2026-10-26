/** No ISRC could be looked up (Spotify or our token function is down): the page shows the "unavailable" alert. */
export class TracksUnavailableError extends Error {
  public override readonly name = 'TracksUnavailableError';

  constructor(cause?: unknown) {
    super('The tracks service is unavailable.', { cause });
  }
}
