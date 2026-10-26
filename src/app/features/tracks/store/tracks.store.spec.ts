import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { TrackLookupResult } from '../../../models/tracks.types';
import { TrackLookupService } from '../../../services/track-lookup/track-lookup.service';
import { TracksUnavailableError } from '../../../services/track-lookup/tracks-unavailable-error';
import { SortDirection, StatusFilter } from '../domain/domain.enums';
import { errorResult, foundResult, notFoundResult, titles } from '../testing/builders';
import { CHALLENGE_ISRCS } from './store.constants';
import { TracksLoadStatus } from './store.enums';
import { TracksStore } from './tracks.store';

/** Lets the resource's effect run and its request settle (it starts after the first change detection). */
async function settle(): Promise<void> {
  for (let round = 0; round < 3; round++) {
    TestBed.tick();
    await new Promise<void>((resolve) => setTimeout(resolve));
  }
}

/** The API is replaced by one Subject per request, so each test decides when and how it answers. */
function setup() {
  const requests: Subject<readonly TrackLookupResult[]>[] = [];
  const lookup = vi.fn<TrackLookupService['lookup']>(() => {
    const response = new Subject<readonly TrackLookupResult[]>();
    requests.push(response);
    return response;
  });
  TestBed.configureTestingModule({
    providers: [{ provide: TrackLookupService, useValue: { lookup } }],
  });
  return { store: TestBed.inject(TracksStore), lookup, requests };
}

async function loaded(results: readonly TrackLookupResult[]) {
  const page = setup();
  await settle();
  page.requests[0].next(results);
  await settle();
  return page;
}

const LOUCA = foundResult('Louca', { isrc: 'BXKZM1900345' });
const QUASE = foundResult('Quase Nua', { isrc: 'BR1SP1500002', durationMs: 253_320 });
const REPENTE = foundResult('Repente', { isrc: 'BRC310600002', availableInBR: false });
const MISSING = notFoundResult('QZNJX2081700');
const FAILED = errorResult('BXKZM1900338');
const SAMPLE = [QUASE, MISSING, LOUCA, FAILED, REPENTE];

describe('TracksStore', () => {
  describe('loading', () => {
    it('looks up the ISRCs of the challenge by itself', async () => {
      const { store, lookup } = setup();
      await settle();

      expect(lookup).toHaveBeenCalledWith(CHALLENGE_ISRCS);
      expect(store.status()).toBe(TracksLoadStatus.LOADING);
      expect(store.isLoading()).toBe(true);
    });

    it('is ready with the results once they arrive', async () => {
      const { store } = await loaded(SAMPLE);

      expect(store.isReady()).toBe(true);
      expect(store.items()).toHaveLength(5);
    });

    it('is unavailable when the lookup fails, and recovers on "try again"', async () => {
      const { store, requests, lookup } = setup();
      await settle();
      requests[0].error(new TracksUnavailableError(new Error('down')));
      await settle();

      expect(store.isUnavailable()).toBe(true);

      store.reload();
      await settle();
      expect(lookup).toHaveBeenCalledTimes(2);
      requests[1].next(SAMPLE);
      await settle();
      expect(store.isReady()).toBe(true);
    });
  });

  describe('order', () => {
    it('sorts the tracks A to Z, with the ISRCs without a track after them', async () => {
      const { store } = await loaded(SAMPLE);

      expect(store.direction()).toBe(SortDirection.ASC);
      expect(titles(store.items())).toEqual([
        'Louca',
        'Quase Nua',
        'Repente',
        undefined,
        undefined,
      ]);
    });

    it('reverses only the tracks when toggled, and goes back when toggled again', async () => {
      const { store } = await loaded(SAMPLE);

      store.toggleDirection();
      expect(titles(store.items()).slice(0, 3)).toEqual(['Repente', 'Quase Nua', 'Louca']);
      expect(store.items().slice(3)).toEqual([MISSING, FAILED]);

      store.toggleDirection();
      expect(store.direction()).toBe(SortDirection.ASC);
    });
  });

  describe('filters', () => {
    it('shows everything until the visitor filters', async () => {
      const { store } = await loaded(SAMPLE);

      expect(store.visibleItems()).toEqual(store.items());
      expect(store.isFiltered()).toBe(false);
    });

    it('filters by the typed text', async () => {
      const { store } = await loaded(SAMPLE);

      store.setQuery('quase');

      expect(store.visibleItems()).toEqual([QUASE]);
      expect(store.isFiltered()).toBe(true);
    });

    it('filters by status and by text together', async () => {
      const { store } = await loaded(SAMPLE);

      store.setStatusFilter(StatusFilter.AVAILABLE_BR);
      expect(titles(store.visibleItems())).toEqual(['Louca', 'Quase Nua']);

      store.setQuery('louca');
      expect(store.visibleItems()).toEqual([LOUCA]);
    });

    it('clears both filters at once', async () => {
      const { store } = await loaded(SAMPLE);
      store.setStatusFilter(StatusFilter.NOT_FOUND);
      store.setQuery('zzz');

      store.clearFilters();

      expect(store.query()).toBe('');
      expect(store.statusFilter()).toBe(StatusFilter.ALL);
      expect(store.visibleItems()).toHaveLength(5);
    });
  });

  describe('summary and unresolved ISRCs', () => {
    it('summarizes the results', async () => {
      const { store } = await loaded(SAMPLE);

      expect(store.summary()).toMatchObject({
        total: 5,
        found: 3,
        availableInBR: 2,
        unavailableInBR: 1,
        notFound: 1,
        failed: 1,
      });
    });

    it('lists the ISRCs that failed and the ones Spotify does not know', async () => {
      const { store } = await loaded(SAMPLE);

      expect(store.failedIsrcs()).toEqual(['BXKZM1900338']);
      expect(store.notFoundIsrcs()).toEqual(['QZNJX2081700']);
    });
  });

  describe('track in focus', () => {
    it('is nothing before the results arrive', () => {
      const { store } = setup();

      expect(store.selected()).toBeNull();
    });

    it('starts at the first track of the list', async () => {
      const { store } = await loaded(SAMPLE);

      expect(store.selected()?.title).toBe('Louca');
    });

    it('follows the row the visitor picks, and keeps it when the order changes', async () => {
      const { store } = await loaded(SAMPLE);

      store.select('BRC310600002');
      expect(store.selected()?.title).toBe('Repente');

      store.toggleDirection();
      expect(store.selected()?.title).toBe('Repente');
    });

    it('is nothing for an ISRC without a track', async () => {
      const { store } = await loaded(SAMPLE);

      store.select('QZNJX2081700');

      expect(store.selected()).toBeNull();
    });

    it('is nothing when no ISRC became a track', async () => {
      const { store } = await loaded([MISSING, FAILED]);

      expect(store.selected()).toBeNull();
    });
  });
});
