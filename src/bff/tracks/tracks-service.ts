import { LookupErrorCode, LookupStatus } from '../../contract/tracks.enums';
import { TrackLookupResult } from '../../contract/tracks.types';
import { Logger } from '../shared/shared.interfaces';
import { SpotifyUnavailableError } from '../spotify/spotify-errors';
import { TrackFinder } from './finder/finder.interfaces';

/**
 * Looks up many ISRCs, isolating failures so one bad ISRC never hides the others.
 * Parallelism is bounded where Spotify is called (see LimitedTrackSearch), not here.
 */
export class TracksService {
  constructor(
    private readonly _finder: TrackFinder,
    private readonly _logger: Logger,
  ) {}

  public lookup(isrcs: readonly string[]): Promise<TrackLookupResult[]> {
    return Promise.all(isrcs.map((isrc) => this._lookupOne(isrc)));
  }

  private async _lookupOne(isrc: string): Promise<TrackLookupResult> {
    try {
      const track = await this._finder.findByIsrc(isrc);
      return track
        ? { status: LookupStatus.FOUND, isrc, track }
        : { status: LookupStatus.NOT_FOUND, isrc };
    } catch (error) {
      if (error instanceof SpotifyUnavailableError) {
        this._logger.warn(`Lookup of ${isrc} failed: ${error.message}`);
        return {
          status: LookupStatus.ERROR,
          isrc,
          code: LookupErrorCode.INTEGRATION_UNAVAILABLE,
        };
      }
      this._logger.error(`Unexpected error looking up ${isrc}`, error);
      return { status: LookupStatus.ERROR, isrc, code: LookupErrorCode.INTERNAL_ERROR };
    }
  }
}
