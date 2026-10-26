import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { TimeoutError, firstValueFrom, timeout } from 'rxjs';
import { isSpotifyTrack } from './is-spotify-track';
import { SpotifyApiError } from './spotify-api-error';
import {
  SEARCH_LIMIT,
  SPOTIFY_REQUEST_TIMEOUT_MS,
  SPOTIFY_SEARCH_URL,
} from './spotify-web.constants';
import { SpotifyApiFailure } from './spotify-web.enums';
import { SearchPage, SearchPageQuery, SpotifySearchResponse } from './spotify-web.interfaces';

/**
 * Client of the Spotify Web API, called straight from the browser. It only knows Spotify's HTTP contract: one
 * request, one validated answer, or a `SpotifyApiError`. The token is added by `spotifyAuthInterceptor`;
 * retries and the app's rules live in `services/`.
 */
@Injectable({ providedIn: 'root' })
export class SpotifySearchApiService {
  private readonly _http = inject(HttpClient);

  /** One page of `GET /v1/search?q=isrc:…&type=track`. */
  public async searchPage(query: SearchPageQuery): Promise<SearchPage> {
    let params = new HttpParams()
      .set('q', `isrc:${query.isrc}`)
      .set('type', 'track')
      .set('limit', SEARCH_LIMIT)
      .set('offset', query.offset);
    if (query.market) {
      params = params.set('market', query.market);
    }

    let body: Partial<SpotifySearchResponse> | null;
    try {
      body = await firstValueFrom(
        this._http
          .get<Partial<SpotifySearchResponse> | null>(SPOTIFY_SEARCH_URL, { params })
          .pipe(timeout(SPOTIFY_REQUEST_TIMEOUT_MS)),
      );
    } catch (cause) {
      throw toApiError(cause);
    }

    const items = body?.tracks?.items;
    if (!Array.isArray(items) || !items.every(isSpotifyTrack)) {
      throw new SpotifyApiError(SpotifyApiFailure.MALFORMED);
    }
    return { items, hasNext: typeof body?.tracks?.next === 'string' };
  }
}

/** Turns what HttpClient failed with into a `SpotifyApiError`; anything else is thrown back as is. */
function toApiError(cause: unknown): SpotifyApiError {
  if (cause instanceof HttpErrorResponse && cause.status >= 400) {
    return new SpotifyApiError(
      SpotifyApiFailure.HTTP,
      cause.status,
      retryAfterMs(cause.headers.get('retry-after')),
      { cause },
    );
  }
  if ((cause instanceof HttpErrorResponse && cause.status === 0) || cause instanceof TimeoutError) {
    return new SpotifyApiError(SpotifyApiFailure.NETWORK, undefined, undefined, { cause });
  }
  if (cause instanceof HttpErrorResponse) {
    // A 2xx whose body is not JSON (HttpClient reports the parse failure as an HttpErrorResponse).
    return new SpotifyApiError(SpotifyApiFailure.MALFORMED, undefined, undefined, { cause });
  }
  // Not an answer from Spotify at all (no token, for instance): pass it on as it is.
  throw cause;
}

/** `Retry-After` in seconds → milliseconds, or `undefined` when absent or unreadable. */
function retryAfterMs(header: string | null): number | undefined {
  if (header === null) {
    return undefined;
  }
  const seconds = Number(header);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds * 1000 : undefined;
}
