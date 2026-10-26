import { PLATFORM_ID, TransferState } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { LookupStatus } from '../../../../contract/tracks.enums';
import { TrackLookupResult } from '../../../../contract/tracks.types';
import { TracksApi } from '../api/tracks-api';
import { TracksStore } from './tracks-store';
import { TracksUnavailableError } from '../api/tracks-unavailable-error';
import { CHALLENGE_ISRCS, TRACKS_TRANSFER_KEY } from './store.constants';
import { SortDirection } from '../domain/domain.enums';
import { TracksLoadStatus } from './store.enums';
import { errorResult, foundResult, notFoundResult, titles } from '../testing/builders';

/** Lets the resource's effect run and its request settle (it starts after the first change detection). */
async function settle(): Promise<void> {
  for (let round = 0; round < 3; round++) {
    TestBed.tick();
    await new Promise<void>((resolve) => setTimeout(resolve));
  }
}

/** The API is replaced by one Subject per request, so each test decides when and how it answers. */
function setup(options: { platform?: 'browser' | 'server'; seed?: TrackLookupResult[] } = {}) {
  const requests: Subject<readonly TrackLookupResult[]>[] = [];
  const lookup = vi.fn<TracksApi['lookup']>(() => {
    const response = new Subject<readonly TrackLookupResult[]>();
    requests.push(response);
    return response;
  });
  TestBed.configureTestingModule({
    providers: [
      { provide: TracksApi, useValue: { lookup } },
      { provide: PLATFORM_ID, useValue: options.platform ?? 'browser' },
    ],
  });
  if (options.seed) {
    TestBed.inject(TransferState).set(TRACKS_TRANSFER_KEY, options.seed);
  }
  return { store: TestBed.inject(TracksStore), lookup, requests };
}

/** A store whose first request was answered. */
async function loaded(results: readonly TrackLookupResult[]) {
  const page = setup();
  await settle();
  page.requests[0].next(results);
  await settle();
  return page;
}

describe('TracksStore', () => {
  describe('sort direction', () => {
    const sample = [
      foundResult('Quase Nua'),
      notFoundResult('XX1AA0000001'),
      foundResult('Louca'),
      foundResult('Repente'),
    ];

    it('starts from A to Z', async () => {
      const { store } = await loaded(sample);

      expect(store.direction()).toBe(SortDirection.ASC);
      expect(titles(store.items()).slice(0, 3)).toEqual(['Louca', 'Quase Nua', 'Repente']);
    });

    it('reverses the tracks when toggled, and goes back when toggled again', async () => {
      const { store } = await loaded(sample);

      store.toggleDirection();
      expect(store.direction()).toBe(SortDirection.DESC);
      expect(titles(store.items()).slice(0, 3)).toEqual(['Repente', 'Quase Nua', 'Louca']);

      store.toggleDirection();
      expect(store.direction()).toBe(SortDirection.ASC);
      expect(titles(store.items()).slice(0, 3)).toEqual(['Louca', 'Quase Nua', 'Repente']);
    });

    it('keeps the ISRCs that are not in the database after the tracks, in both directions', async () => {
      const { store } = await loaded(sample);

      store.toggleDirection();

      expect(store.items()[3].isrc).toBe('XX1AA0000001');
      expect(store.notFoundIsrcs()).toEqual(['XX1AA0000001']);
    });

    it('survives a new lookup: the visitor chose it', async () => {
      const { store, requests } = await loaded([foundResult('Louca'), foundResult('Quase Nua')]);
      store.toggleDirection();

      store.reload();
      await settle();
      requests[1].next([foundResult('Louca'), foundResult('Quase Nua')]);
      await settle();

      expect(titles(store.items())).toEqual(['Quase Nua', 'Louca']);
    });
  });

  describe('the lookup', () => {
    it('starts by itself with the challenge ISRCs, once', async () => {
      const { lookup } = setup();

      await settle();

      expect(lookup).toHaveBeenCalledExactlyOnceWith(CHALLENGE_ISRCS);
    });

    it('is loading, and has no items, until the response arrives', async () => {
      const { store } = setup();

      await settle();

      expect(store.status()).toBe(TracksLoadStatus.LOADING);
      expect(store.isLoading()).toBe(true);
      expect(store.items()).toEqual([]);
    });

    it('becomes ready and exposes the items sorted by title', async () => {
      const { store } = await loaded([
        foundResult('Repente'),
        foundResult('Louca'),
        foundResult('Quase Nua'),
      ]);

      expect(store.status()).toBe(TracksLoadStatus.READY);
      expect(store.isReady()).toBe(true);
      expect(store.isLoading()).toBe(false);
      expect(titles(store.items())).toEqual(['Louca', 'Quase Nua', 'Repente']);
    });

    it('lists not-found ISRCs after the tracks instead of dropping them', async () => {
      const { store } = await loaded([notFoundResult('BR1SP1200070'), foundResult('Louca')]);

      expect(store.items().map((item) => item.status)).toEqual([
        LookupStatus.FOUND,
        LookupStatus.NOT_FOUND,
      ]);
    });
  });

  describe('failures', () => {
    it('is unavailable, with no items, when the whole lookup fails', async () => {
      const { store, requests } = setup();
      await settle();

      requests[0].error(new TracksUnavailableError());
      await settle();

      expect(store.status()).toBe(TracksLoadStatus.UNAVAILABLE);
      expect(store.isUnavailable()).toBe(true);
      expect(store.isLoading()).toBe(false);
      expect(store.items()).toEqual([]);
    });

    it('counts ISRCs that failed while the rest loaded, without being unavailable', async () => {
      const { store } = await loaded([
        foundResult('Louca'),
        errorResult('BR1SP1200070'),
        errorResult('BR1SP1200071'),
      ]);

      expect(store.isUnavailable()).toBe(false);
      expect(store.status()).toBe(TracksLoadStatus.READY);
      expect(store.failedCount()).toBe(2);
      expect(store.items()).toHaveLength(3);
    });

    it('lists the ISRCs that failed, in display order, not the ones that merely have no track', async () => {
      const { store } = await loaded([
        errorResult('BR1SP1200071'),
        foundResult('Louca'),
        notFoundResult('XX1AA0000001'),
        errorResult('BR1SP1200070'),
      ]);

      expect(store.failedIsrcs()).toEqual(['BR1SP1200070', 'BR1SP1200071']);
    });

    it('counts what was found, what is not in the database and the total', async () => {
      const { store } = await loaded([
        foundResult('Louca'),
        foundResult('Quase Nua'),
        notFoundResult('XX1AA0000002'),
        notFoundResult('XX1AA0000001'),
        errorResult('BR1SP1200070'),
      ]);

      expect(store.foundCount()).toBe(2);
      expect(store.notFoundCount()).toBe(2);
      expect(store.totalCount()).toBe(5);
      expect(store.notFoundIsrcs()).toEqual(['XX1AA0000001', 'XX1AA0000002']);
    });

    it('has no failures when everything loaded', async () => {
      const { store } = await loaded([foundResult('Louca')]);

      expect(store.failedCount()).toBe(0);
    });

    it('recovers when the user tries again', async () => {
      const { store, requests } = setup();
      await settle();
      requests[0].error(new TracksUnavailableError());
      await settle();

      store.reload();
      await settle();
      expect(store.status()).toBe(TracksLoadStatus.LOADING);
      requests[1].next([foundResult('Louca')]);
      await settle();

      expect(store.status()).toBe(TracksLoadStatus.READY);
      expect(titles(store.items())).toEqual(['Louca']);
    });
  });

  describe('reloading', () => {
    it('keeps the previous items visible while the new lookup is under way', async () => {
      const { store } = await loaded([foundResult('Louca')]);

      store.reload();
      await settle();

      expect(store.isLoading()).toBe(true);
      expect(titles(store.items())).toEqual(['Louca']);
    });
  });

  it('stops listening to a pending request when the store is destroyed', async () => {
    const { requests } = setup();
    await settle();

    TestBed.resetTestingModule();

    expect(requests[0].observed).toBe(false);
  });

  describe('in the browser, after a server render', () => {
    const seed = [foundResult('Repente'), foundResult('Louca'), notFoundResult('XX1AA0000001')];

    it('starts ready with what the server looked up, without asking again', async () => {
      const { store, lookup } = setup({ seed });
      await settle();

      expect(lookup).not.toHaveBeenCalled();
      expect(store.status()).toBe(TracksLoadStatus.READY);
      expect(titles(store.items()).slice(0, 2)).toEqual(['Louca', 'Repente']);
      expect(store.notFoundIsrcs()).toEqual(['XX1AA0000001']);
      expect(store.totalCount()).toBe(3);
    });

    it('asks again when the visitor retries, and the new answer replaces the server one', async () => {
      const { store, lookup, requests } = setup({ seed });
      await settle();

      store.reload();
      await settle();
      expect(lookup).toHaveBeenCalledExactlyOnceWith(CHALLENGE_ISRCS);
      expect(store.isLoading()).toBe(true);
      requests[0].next([foundResult('Quase Nua')]);
      await settle();

      expect(store.isReady()).toBe(true);
      expect(titles(store.items())).toEqual(['Quase Nua']);
    });

    it('asks itself when the server had nothing to hand over', async () => {
      const { lookup } = setup();
      await settle();

      expect(lookup).toHaveBeenCalledTimes(1);
    });
  });

  describe('on the server', () => {
    it('looks up and hands the results to the browser', async () => {
      const { store, requests } = setup({ platform: 'server' });
      await settle();
      const results = [foundResult('Louca'), notFoundResult('XX1AA0000001')];

      requests[0].next(results);
      await settle();

      expect(store.isReady()).toBe(true);
      expect(TestBed.inject(TransferState).get(TRACKS_TRANSFER_KEY, null)).toEqual(results);
    });

    it('never draws the outage (the browser asks again) and hands nothing over', async () => {
      const { store, requests } = setup({ platform: 'server' });
      await settle();

      requests[0].error(new TracksUnavailableError());
      await settle();

      expect(store.isUnavailable()).toBe(false);
      expect(store.isLoading()).toBe(true);
      expect(TestBed.inject(TransferState).get(TRACKS_TRANSFER_KEY, null)).toBeNull();
    });

    it('ignores any seed: it is the one that produces it', async () => {
      const { lookup } = setup({ platform: 'server', seed: [foundResult('Louca')] });
      await settle();

      expect(lookup).toHaveBeenCalledTimes(1);
    });
  });
});
