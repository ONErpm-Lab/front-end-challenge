import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, filter, map, mergeMap, Observable, of, throwError, toArray } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config';
import { isAppErrorOfKind } from '../../../core/errors/app-error';
import { retryBackoff } from '../../../core/http/retry-backoff';
import type { Track } from '../domain/track';
import { TrackRepository } from '../domain/track-repository';
import type { SpotifySearchResponseDto } from './spotify-track.dto';
import { toTrack } from './spotify-track.mapper';

/**
 * Spotify-backed {@link TrackRepository}. HTTP in, {@link Track} out — no formatting,
 * no sorting, no UI concerns.
 *
 * Spotify has no batch-by-ISRC endpoint, so this fans out one search per code with a
 * bounded concurrency. That fan-out is exactly the detail the abstract contract hides.
 */
@Injectable()
export class SpotifyTrackRepository extends TrackRepository {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);

  override findByIsrcs(isrcs: readonly string[]): Observable<readonly Track[]> {
    return of(...isrcs).pipe(
      mergeMap((isrc) => this.findByIsrc(isrc), this.config.lookupConcurrency),
      // An unresolvable code drops out; a broken provider does not (see findByIsrc).
      filter((track): track is Track => track !== null),
      toArray(),
    );
  }

  private findByIsrc(isrc: string): Observable<Track | null> {
    // `market` is required, not optional: Spotify no longer returns
    // `available_markets` at all for recently created apps, and `is_playable` — the
    // only remaining market signal, and what the spec's BR flag is built on — is
    // returned only when this parameter is present.
    const params = new HttpParams()
      .set('q', `isrc:${isrc}`)
      .set('type', 'track')
      .set('limit', 1)
      .set('market', this.config.targetMarket);

    return this.http
      .get<SpotifySearchResponseDto>(`${this.config.spotifyApiUrl}/search`, { params })
      .pipe(
        retryBackoff(this.config.maxRetries),
        map((response) => response.tracks?.items?.[0]),
        map((dto) => (dto ? toTrack(dto, isrc, this.config.targetMarket) : null)),
        catchError((error: unknown) =>
          // "This code has no track" is missing data — skip it and keep the batch alive.
          // Anything else means the integration itself is unavailable, which the spec
          // requires us to surface, so it must keep propagating.
          isAppErrorOfKind(error, 'notFound') ? of(null) : throwError(() => error),
        ),
      );
  }
}
