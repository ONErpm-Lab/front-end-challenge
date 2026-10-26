import {
  Injectable,
  PLATFORM_ID,
  TransferState,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { LookupStatus } from '../../../../contract/tracks.enums';
import { TrackLookupResult } from '../../../../contract/tracks.types';
import { sortResults } from '../domain/sort-results';
import { TITLE_SORT_LOCALE } from '../domain/domain.constants';
import { CHALLENGE_ISRCS, TRACKS_TRANSFER_KEY } from './store.constants';
import { SortDirection } from '../domain/domain.enums';
import { TracksLoadStatus } from './store.enums';
import { TracksApi } from '../api/tracks-api';

/**
 * State of the tracks page: what is loading, what came back and how it should be ordered.
 *
 * The lookup starts by itself (an `rxResource`), on the server too: the server waits for it, renders the tracks
 * into the HTML and hands the results to the browser through `TransferState`, which then starts from them
 * instead of asking again (and hydrates the very list the server drew).
 */
@Injectable({ providedIn: 'root' })
export class TracksStore {
  private readonly _api = inject(TracksApi);
  private readonly _transfer = inject(TransferState);
  private readonly _isServer = isPlatformServer(inject(PLATFORM_ID));
  /** What the server already looked up, or `null` (always on the server, and in the browser without SSR). */
  private readonly _seed = this._isServer ? null : this._transfer.get(TRACKS_TRANSFER_KEY, null);
  /** The visitor asked again ("try again"): the seed no longer stands in for the lookup. */
  private readonly _refreshed = signal(false);
  private readonly _direction = signal(SortDirection.ASC);

  private readonly _lookup = rxResource({
    // No params, no lookup: with a seed the browser has nothing to ask until the visitor retries.
    params: () => (this._seed !== null && !this._refreshed() ? undefined : CHALLENGE_ISRCS),
    stream: ({ params }) => this._api.lookup(params),
  });

  private readonly _results = computed<readonly TrackLookupResult[]>(() => {
    if (this._lookup.hasValue()) {
      return this._lookup.value();
    }
    return this._seed !== null && !this._refreshed() ? this._seed : [];
  });

  public readonly status = computed(() => {
    switch (this._lookup.status()) {
      case 'idle':
        return this._seed !== null && !this._refreshed()
          ? TracksLoadStatus.READY
          : TracksLoadStatus.IDLE;
      case 'loading':
      case 'reloading':
        return TracksLoadStatus.LOADING;
      case 'error':
        // The server never draws the outage: the browser asks again and decides, so both start from the same
        // placeholders (a different tree would not hydrate).
        return this._isServer ? TracksLoadStatus.LOADING : TracksLoadStatus.UNAVAILABLE;
      default:
        return TracksLoadStatus.READY;
    }
  });

  /** The order of the tracks by title. */
  public readonly direction = this._direction.asReadonly();

  /** Results in display order (see `sortResults`). */
  public readonly items = computed(() =>
    sortResults(this._results(), TITLE_SORT_LOCALE, this._direction()),
  );
  public readonly isReady = computed(() => this.status() === TracksLoadStatus.READY);
  public readonly isLoading = computed(() => this.status() === TracksLoadStatus.LOADING);
  public readonly isUnavailable = computed(() => this.status() === TracksLoadStatus.UNAVAILABLE);

  /** ISRCs that failed while the rest loaded (in display order): worth a warning, not a blocking alert. */
  public readonly failedIsrcs = computed(() =>
    this.items()
      .filter((result) => result.status === LookupStatus.ERROR)
      .map((result) => result.isrc),
  );
  public readonly failedCount = computed(() => this.failedIsrcs().length);

  /** ISRCs Spotify has no track for: they are not in the database, as the page says (in display order). */
  public readonly notFoundIsrcs = computed(() =>
    this.items()
      .filter((result) => result.status === LookupStatus.NOT_FOUND)
      .map((result) => result.isrc),
  );
  public readonly notFoundCount = computed(() => this.notFoundIsrcs().length);

  public readonly foundCount = computed(
    () => this._results().filter((result) => result.status === LookupStatus.FOUND).length,
  );
  public readonly totalCount = computed(() => this._results().length);

  constructor() {
    if (this._isServer) {
      effect(() => {
        if (this._lookup.status() === 'resolved' && this._lookup.hasValue()) {
          this._transfer.set(TRACKS_TRANSFER_KEY, this._lookup.value());
        }
      });
    }
  }

  /** Reverses the order of the tracks by title (A to Z, then Z to A). */
  public toggleDirection(): void {
    this._direction.update((direction) =>
      direction === SortDirection.ASC ? SortDirection.DESC : SortDirection.ASC,
    );
  }

  /** Looks the ISRCs up again ("try again"); the request still in flight, if any, is the one that counts. */
  public reload(): void {
    if (this._seed !== null && !this._refreshed()) {
      this._refreshed.set(true);
    } else {
      this._lookup.reload();
    }
  }
}
