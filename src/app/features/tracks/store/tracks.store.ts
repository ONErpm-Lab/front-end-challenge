import { Injectable, computed, inject, linkedSignal, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { LookupStatus } from '../../../models/tracks.enums';
import { Track } from '../../../models/tracks.interfaces';
import { TrackLookupResult } from '../../../models/tracks.types';
import { TrackLookupService } from '../../../services/track-lookup/track-lookup.service';
import { TITLE_SORT_LOCALE } from '../domain/domain.constants';
import { SortDirection, StatusFilter } from '../domain/domain.enums';
import { filterByStatus } from '../domain/filter-by-status';
import { filterResults } from '../domain/filter-results';
import { sortResults } from '../domain/sort-results';
import { summarizeResults } from '../domain/summarize-results';
import { CHALLENGE_ISRCS } from './store.constants';
import { TracksLoadStatus } from './store.enums';

/**
 * State of the catalog page: the lookup, its order, the filters and the track in focus. The lookup starts by
 * itself (an `rxResource`); everything the page shows is derived from it with pure functions (`domain/`).
 */
@Injectable({ providedIn: 'root' })
export class TracksStore {
  private readonly _tracks = inject(TrackLookupService);
  private readonly _direction = signal(SortDirection.ASC);
  private readonly _query = signal('');
  private readonly _statusFilter = signal(StatusFilter.ALL);

  private readonly _lookup = rxResource({
    params: () => CHALLENGE_ISRCS,
    stream: ({ params }) => this._tracks.lookup(params),
  });

  private readonly _results = computed<readonly TrackLookupResult[]>(() =>
    this._lookup.hasValue() ? this._lookup.value() : [],
  );

  public readonly status = computed(() => {
    switch (this._lookup.status()) {
      case 'idle':
        return TracksLoadStatus.IDLE;
      case 'loading':
      case 'reloading':
        return TracksLoadStatus.LOADING;
      case 'error':
        return TracksLoadStatus.UNAVAILABLE;
      default:
        return TracksLoadStatus.READY;
    }
  });
  public readonly isReady = computed(() => this.status() === TracksLoadStatus.READY);
  public readonly isLoading = computed(() => this.status() === TracksLoadStatus.LOADING);
  public readonly isUnavailable = computed(() => this.status() === TracksLoadStatus.UNAVAILABLE);

  public readonly direction = this._direction.asReadonly();
  public readonly query = this._query.asReadonly();
  public readonly statusFilter = this._statusFilter.asReadonly();

  /** Every result in display order (see `sortResults`). */
  public readonly items = computed(() =>
    sortResults(this._results(), TITLE_SORT_LOCALE, this._direction()),
  );
  /** What the table shows: the items under the chosen status and matching the typed query. */
  public readonly visibleItems = computed(() =>
    filterResults(filterByStatus(this.items(), this._statusFilter()), this._query()),
  );
  public readonly isFiltered = computed(
    () => this._query().trim() !== '' || this._statusFilter() !== StatusFilter.ALL,
  );

  /** The numbers of the summary cards. */
  public readonly summary = computed(() => summarizeResults(this._results()));

  /** ISRCs that failed while the rest loaded (in display order): worth a warning, not a blocking alert. */
  public readonly failedIsrcs = computed(() => this._isrcsWith(LookupStatus.ERROR));
  /** ISRCs Spotify has no track for (in display order). */
  public readonly notFoundIsrcs = computed(() => this._isrcsWith(LookupStatus.NOT_FOUND));

  /**
   * The ISRC of the track in focus (the detail panel). It starts at the first track of the list and goes back
   * to it whenever the results change; the visitor moves it by picking a row.
   */
  private readonly _selectedIsrc = linkedSignal<readonly TrackLookupResult[], string | null>({
    source: this.items,
    computation: (items, previous) => {
      const kept = previous?.value;
      if (kept && items.some((item) => item.isrc === kept && item.status === LookupStatus.FOUND)) {
        return kept;
      }
      return items.find((item) => item.status === LookupStatus.FOUND)?.isrc ?? null;
    },
  });

  public readonly selected = computed<Track | null>(() => {
    const isrc = this._selectedIsrc();
    const result = this._results().find((item) => item.isrc === isrc);
    return result?.status === LookupStatus.FOUND ? result.track : null;
  });

  public select(isrc: string): void {
    this._selectedIsrc.set(isrc);
  }

  public setQuery(query: string): void {
    this._query.set(query);
  }

  public setStatusFilter(filter: StatusFilter): void {
    this._statusFilter.set(filter);
  }

  public clearFilters(): void {
    this._query.set('');
    this._statusFilter.set(StatusFilter.ALL);
  }

  /** Reverses the order of the tracks by title (A to Z, then Z to A). */
  public toggleDirection(): void {
    this._direction.update((direction) =>
      direction === SortDirection.ASC ? SortDirection.DESC : SortDirection.ASC,
    );
  }

  /** Looks the ISRCs up again ("try again"). */
  public reload(): void {
    this._lookup.reload();
  }

  private _isrcsWith(status: LookupStatus): readonly string[] {
    return this.items()
      .filter((result) => result.status === status)
      .map((result) => result.isrc);
  }
}
