import { Injectable, inject } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { LookupErrorCode, LookupStatus } from '../../models/tracks.enums';
import { TrackLookupResult } from '../../models/tracks.types';
import { ConcurrencyLimiter } from '../common/concurrency-limiter';
import { SpotifySearchService } from './spotify-search.service';
import { MAX_CONCURRENT_SEARCHES } from './track-lookup.constants';
import { SpotifyTrackFinder } from './track-finder';
import { TracksUnavailableError } from './tracks-unavailable-error';

/**
 * What the app asks for: the tracks of some ISRCs. Each ISRC becomes a result of its own (found, not found or
 * failed), so one bad ISRC never hides the others; when every one fails, Spotify (or our token) is down and the
 * whole lookup fails with `TracksUnavailableError`.
 */
@Injectable({ providedIn: 'root' })
export class TrackLookupService {
  private readonly _search = inject(SpotifySearchService);
  private readonly _limiter = new ConcurrencyLimiter(MAX_CONCURRENT_SEARCHES);
  private readonly _finder = new SpotifyTrackFinder({
    searchByIsrc: (isrc, options) =>
      this._limiter.run(() => this._search.searchByIsrc(isrc, options)),
  });

  public lookup(isrcs: readonly string[]): Observable<readonly TrackLookupResult[]> {
    return isrcs.length === 0 ? of([]) : from(this._lookupAll(isrcs));
  }

  private async _lookupAll(isrcs: readonly string[]): Promise<readonly TrackLookupResult[]> {
    const results = await Promise.all(isrcs.map((isrc) => this._lookupOne(isrc)));
    if (results.every((result) => result.status === LookupStatus.ERROR)) {
      throw new TracksUnavailableError();
    }
    return results;
  }

  private async _lookupOne(isrc: string): Promise<TrackLookupResult> {
    try {
      const track = await this._finder.findByIsrc(isrc);
      return track
        ? { status: LookupStatus.FOUND, isrc, track }
        : { status: LookupStatus.NOT_FOUND, isrc };
    } catch {
      return { status: LookupStatus.ERROR, isrc, code: LookupErrorCode.INTEGRATION_UNAVAILABLE };
    }
  }
}
