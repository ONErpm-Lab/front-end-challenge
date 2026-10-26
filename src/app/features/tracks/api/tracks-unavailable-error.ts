/** The BFF (or the network to it) failed: the page shows the "integration unavailable" alert. */
export class TracksUnavailableError extends Error {
  public override readonly name = 'TracksUnavailableError';

  constructor(cause?: unknown) {
    super('The tracks service is unavailable.', { cause });
  }
}
