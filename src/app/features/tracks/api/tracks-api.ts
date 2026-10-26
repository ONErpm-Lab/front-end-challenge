import { HttpClient, HttpParams } from '@angular/common/http';
import { isPlatformServer } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError, timeout } from 'rxjs';
import { TracksResponse } from '../../../../contract/tracks.interfaces';
import { TrackLookupResult } from '../../../../contract/tracks.types';
import {
  ISRC_QUERY_PARAM,
  TRACKS_API_URL,
  TRACKS_REQUEST_TIMEOUT_MS,
  TRACKS_SERVER_REQUEST_TIMEOUT_MS,
} from './api.constants';
import { TracksUnavailableError } from './tracks-unavailable-error';

/** Client of the BFF `GET /api/tracks`. Any failure becomes a `TracksUnavailableError`. */
@Injectable({ providedIn: 'root' })
export class TracksApi {
  private readonly _http = inject(HttpClient);
  private readonly _timeoutMs = isPlatformServer(inject(PLATFORM_ID))
    ? TRACKS_SERVER_REQUEST_TIMEOUT_MS
    : TRACKS_REQUEST_TIMEOUT_MS;

  public lookup(isrcs: readonly string[]): Observable<readonly TrackLookupResult[]> {
    if (isrcs.length === 0) {
      return of([]);
    }

    const params = new HttpParams().set(ISRC_QUERY_PARAM, isrcs.join(','));
    return this._http.get<TracksResponse>(TRACKS_API_URL, { params }).pipe(
      timeout(this._timeoutMs),
      map((response) => response.results),
      catchError((cause: unknown) => throwError(() => new TracksUnavailableError(cause))),
    );
  }
}
