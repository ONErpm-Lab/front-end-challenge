import { Injectable, inject } from '@angular/core';
import { SpotifyApiError } from '../../api/spotify-web/spotify-api-error';
import { SpotifySearchApiService } from '../../api/spotify-web/spotify-search-api.service';
import { SEARCH_LIMIT } from '../../api/spotify-web/spotify-web.constants';
import { SpotifyApiFailure } from '../../api/spotify-web/spotify-web.enums';
import { SearchPage, SpotifyTrack } from '../../api/spotify-web/spotify-web.interfaces';
import { NOW, SLEEP } from '../common/time';
import {
  DEFAULT_RETRY_AFTER_MS,
  MAX_RATE_LIMIT_RETRIES,
  MAX_RATE_LIMIT_WAIT_MS,
  MAX_SEARCH_PAGES,
} from './track-lookup.constants';
import { SearchOptions, TrackSearch } from './track-lookup.interfaces';

/**
 * Searches Spotify for an ISRC, following its pages. A rate limit (429) is waited out when short, once, and
 * shared by every search, so the others do not hit the limit again in the meantime. (The token, and a refused
 * one, are the job of `spotifyAuthInterceptor`.)
 */
@Injectable({ providedIn: 'root' })
export class SpotifySearchService implements TrackSearch {
  private readonly _api = inject(SpotifySearchApiService);
  private readonly _now = inject(NOW);
  private readonly _sleep = inject(SLEEP);
  /** Until when Spotify asked us to back off (epoch ms), for every search. */
  private _rateLimitedUntil = 0;

  public async searchByIsrc(
    isrc: string,
    options: SearchOptions = {},
  ): Promise<readonly SpotifyTrack[]> {
    const tracks: SpotifyTrack[] = [];
    for (let page = 0; page < MAX_SEARCH_PAGES; page++) {
      const result = await this._searchPage(isrc, options.market, page * SEARCH_LIMIT);
      tracks.push(...result.items);
      if (!result.hasNext) {
        break;
      }
    }
    return tracks;
  }

  private async _searchPage(
    isrc: string,
    market: string | undefined,
    offset: number,
  ): Promise<SearchPage> {
    let rateLimitRetries = 0;

    while (true) {
      await this._awaitCooldown();
      try {
        return await this._api.searchPage({ isrc, market, offset });
      } catch (error) {
        if (!(error instanceof SpotifyApiError) || error.failure !== SpotifyApiFailure.HTTP) {
          throw error;
        }
        if (error.status === 429) {
          this._startCooldown(error.retryAfterMs ?? DEFAULT_RETRY_AFTER_MS);
          if (rateLimitRetries < MAX_RATE_LIMIT_RETRIES) {
            rateLimitRetries++;
            continue;
          }
        }
        throw error;
      }
    }
  }

  private _startCooldown(durationMs: number): void {
    this._rateLimitedUntil = Math.max(this._rateLimitedUntil, this._now() + durationMs);
  }

  /** Waits out a short cooldown; a long one fails right away, without calling Spotify. */
  private async _awaitCooldown(): Promise<void> {
    const remainingMs = Math.max(0, this._rateLimitedUntil - this._now());
    if (remainingMs === 0) {
      return;
    }
    if (remainingMs > MAX_RATE_LIMIT_WAIT_MS) {
      throw new SpotifyApiError(SpotifyApiFailure.HTTP, 429, remainingMs);
    }
    await this._sleep(remainingMs);
  }
}
