import { inject, Injectable } from '@angular/core';
import { delay, map, Observable, of, throwError } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config';
import { appError } from '../../../core/errors/app-error';
import type { Track } from '../domain/track';
import { TrackRepository } from '../domain/track-repository';
import { FIXTURE_TRACKS } from './fixture-tracks';
import { toTrack } from './spotify-track.mapper';

/** Enough latency that loading states are visible while developing. */
const SIMULATED_LATENCY_MS = 450;

/**
 * Offline {@link TrackRepository} backed by local fixtures.
 *
 * TODO(spotify-403): temporary, while Spotify returns 403 for the app owner. Delete
 * this class, `fixture-tracks.ts` and the `useFixtures` config flag once real access
 * works — nothing above the contract needs to change when it goes.
 *
 * It runs the fixtures through the production mapper and honours the same contract,
 * including the "unresolvable code is omitted, provider failure propagates" rule, so
 * UI built against it behaves the same once the real repository takes over.
 *
 * Set `window.__failTracks = true` in the browser console to force the failure path
 * and check the alert without having to break anything.
 */
@Injectable()
export class FixtureTrackRepository extends TrackRepository {
  private readonly config = inject(APP_CONFIG);

  override findByIsrcs(isrcs: readonly string[]): Observable<readonly Track[]> {
    if (shouldSimulateFailure()) {
      return throwError(() =>
        appError('provider', 'O provedor de faixas está indisponível no momento.'),
      ).pipe(delay(SIMULATED_LATENCY_MS));
    }

    return of(isrcs).pipe(
      delay(SIMULATED_LATENCY_MS),
      map((codes) =>
        codes
          .map((isrc) => {
            const fixture = FIXTURE_TRACKS[isrc];
            // A code with no fixture stands in for one Spotify cannot resolve.
            return fixture ? toTrack(fixture, isrc, this.config.targetMarket) : null;
          })
          .filter((track): track is Track => track !== null),
      ),
    );
  }
}

const shouldSimulateFailure = (): boolean =>
  typeof window !== 'undefined' &&
  (window as unknown as { __failTracks?: boolean }).__failTracks === true;
