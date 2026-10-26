import { systemClock, systemSleep } from '../shared/system-time';
import { Clock, FetchFn, Sleep } from '../shared/shared.types';
import { isSpotifyTrack } from './is-spotify-track';
import { SpotifyUnavailableError } from './spotify-errors';
import {
  DEFAULT_RETRY_AFTER_MS,
  MAX_RATE_LIMIT_RETRIES,
  MAX_RATE_LIMIT_WAIT_MS,
  MAX_SEARCH_PAGES,
  REQUEST_TIMEOUT_MS,
  SEARCH_LIMIT,
  SEARCH_URL,
} from './spotify.constants';
import { SpotifyFailureReason } from './spotify.enums';
import {
  AccessTokenProvider,
  SearchOptions,
  SearchPage,
  SpotifyClientOptions,
  SpotifySearchResponse,
  SpotifyTrack,
  TrackSearch,
} from './spotify.interfaces';

export class SpotifyClient implements TrackSearch {
  private readonly _fetchFn: FetchFn;
  private readonly _sleep: Sleep;
  private readonly _now: Clock;
  /** Epoch ms until which Spotify asked us to back off; shared by every search of this client. */
  private _rateLimitedUntil = 0;

  constructor(
    private readonly _tokens: AccessTokenProvider,
    options: SpotifyClientOptions = {},
  ) {
    this._fetchFn = options.fetchFn ?? fetch;
    this._sleep = options.sleep ?? systemSleep;
    this._now = options.now ?? systemClock;
  }

  /** Every track Spotify lists for the ISRC: the API caps a page at 10, so we follow `next`. */
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

  private async _searchPage(isrc: string, market: string | undefined, offset: number) {
    const url = this._buildSearchUrl(isrc, market, offset);
    let tokenRefreshed = false;
    let rateLimitRetries = 0;

    while (true) {
      const response = await this._get(url);
      if (response.ok) {
        return this._parsePage(response);
      }
      if (response.status === 401 && !tokenRefreshed) {
        tokenRefreshed = true;
        this._tokens.invalidate();
        continue;
      }
      if (response.status === 429) {
        this._startCooldown(retryAfterMs(response) ?? DEFAULT_RETRY_AFTER_MS);
        if (rateLimitRetries < MAX_RATE_LIMIT_RETRIES) {
          // The next _get() waits out the cooldown, or gives up if it is too long to wait for.
          rateLimitRetries++;
          continue;
        }
      }
      throw new SpotifyUnavailableError(SpotifyFailureReason.SEARCH_FAILED, {
        status: response.status,
        retryAfterMs: response.status === 429 ? this._cooldownRemainingMs() : undefined,
      });
    }
  }

  private _buildSearchUrl(isrc: string, market: string | undefined, offset: number): string {
    const params = new URLSearchParams({
      q: `isrc:${isrc}`,
      type: 'track',
      limit: String(SEARCH_LIMIT),
      offset: String(offset),
    });
    if (market) {
      params.set('market', market);
    }
    return `${SEARCH_URL}?${params}`;
  }

  private _startCooldown(durationMs: number): void {
    this._rateLimitedUntil = Math.max(this._rateLimitedUntil, this._now() + durationMs);
  }

  /** Honors a cooldown set by any earlier search: wait if it is short, fail locally if it is not. */
  private async _awaitCooldown(): Promise<void> {
    const remainingMs = this._cooldownRemainingMs();
    if (remainingMs <= 0) {
      return;
    }
    if (remainingMs > MAX_RATE_LIMIT_WAIT_MS) {
      throw new SpotifyUnavailableError(SpotifyFailureReason.RATE_LIMITED, {
        status: 429,
        retryAfterMs: remainingMs,
      });
    }
    await this._sleep(remainingMs);
  }

  private _cooldownRemainingMs(): number {
    return Math.max(0, this._rateLimitedUntil - this._now());
  }

  private async _get(url: string): Promise<Response> {
    await this._awaitCooldown();
    const token = await this._tokens.getToken();
    try {
      return await this._fetchFn(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (cause) {
      throw new SpotifyUnavailableError(SpotifyFailureReason.SEARCH_NETWORK_ERROR, { cause });
    }
  }

  private async _parsePage(response: Response): Promise<SearchPage> {
    const body = (await response.json().catch(() => null)) as Partial<SpotifySearchResponse> | null;
    const items = body?.tracks?.items;
    if (!Array.isArray(items) || !items.every(isSpotifyTrack)) {
      throw new SpotifyUnavailableError(SpotifyFailureReason.SEARCH_RESPONSE_MALFORMED);
    }
    return { items, hasNext: typeof body?.tracks?.next === 'string' };
  }
}

/** `Retry-After` in seconds → milliseconds, or `null` when absent/unparseable. */
function retryAfterMs(response: Response): number | null {
  const header = response.headers.get('retry-after');
  if (header === null) {
    return null;
  }
  const seconds = Number(header);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds * 1000 : null;
}
