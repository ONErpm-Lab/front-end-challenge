import { ConcurrencyLimiter } from '../shared/concurrency-limiter';
import { SearchOptions, SpotifyTrack, TrackSearch } from './spotify.interfaces';

/**
 * Decorator that funnels every search through one shared limiter, so the number of simultaneous
 * calls to Spotify stays bounded no matter how many visitors are being served.
 */
export class LimitedTrackSearch implements TrackSearch {
  constructor(
    private readonly _inner: TrackSearch,
    private readonly _limiter: ConcurrencyLimiter,
  ) {}

  public searchByIsrc(isrc: string, options?: SearchOptions): Promise<readonly SpotifyTrack[]> {
    return this._limiter.run(() => this._inner.searchByIsrc(isrc, options));
  }
}
