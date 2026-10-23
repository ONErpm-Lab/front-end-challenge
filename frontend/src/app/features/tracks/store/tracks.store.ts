import { computed, inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withProps,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import type { Isrc } from '../models/isrc.value-object';
import type { LoadStatus } from '@shared/models/load-status';
import type { DataSource, SortDirection, Track } from '../models/track.model';
import { TRACKS_REPOSITORY } from '../ports/tracks-repository.port';
import { CONTRACT_ISRCS } from '../utils/contract-isrcs';
import { sortTracksByTitle } from '../utils/sort-tracks';

interface TracksState {
  status: LoadStatus;
  items: readonly Track[];
  notFound: readonly Isrc[];
  failed: readonly Isrc[];
  direction: SortDirection;
  source: DataSource | null;
}

const initialState: TracksState = {
  status: 'idle',
  items: [],
  notFound: [],
  failed: [],
  direction: 'asc',
  source: null,
};

/**
 * Implementação de `TracksStorePort` com NgRx Signal Store.
 * Depende só da porta `TRACKS_REPOSITORY`; quem a consome injeta `TRACKS_STORE`.
 */
export const TracksSignalStore = signalStore(
  withState(initialState),
  withProps(() => ({ isrcs: CONTRACT_ISRCS })),
  withComputed(({ items, direction }) => ({
    tracks: computed(() => sortTracksByTitle(items(), direction())),
    total: computed(() => items().length),
    availableInBrazil: computed(() => items().filter((t) => t.availableInBrazil).length),
    hasNoPreviews: computed(() => items().length > 0 && items().every((t) => !t.previewUrl)),
  })),
  withMethods((store, repository = inject(TRACKS_REPOSITORY)) => ({
    /** Um novo load cancela o anterior (switchMap). */
    load: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { status: 'loading' })),
        switchMap(() =>
          repository.getTracks(store.isrcs).pipe(
            tapResponse({
              next: ({ tracks, notFound, failed, source }) =>
                patchState(store, { status: 'ready', items: tracks, notFound, failed, source }),
              error: () =>
                patchState(store, {
                  status: 'error',
                  items: [],
                  notFound: [],
                  failed: [],
                  source: null,
                }),
            }),
          ),
        ),
      ),
    ),
    toggleDirection(): void {
      const direction: SortDirection = store.direction() === 'asc' ? 'desc' : 'asc';
      patchState(store, { direction });
    },
  })),
  // O store carrega ao nascer: como é provido na página, nasce e morre com a tela.
  // A página fica só com apresentação, sem decidir quando buscar dados.
  withHooks({ onInit: (store) => store.load() }),
);
