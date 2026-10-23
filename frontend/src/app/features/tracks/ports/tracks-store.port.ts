import { InjectionToken, type Signal } from '@angular/core';
import type { Isrc } from '../models/isrc.value-object';
import type { LoadStatus } from '@shared/models/load-status';
import type { DataSource, SortDirection, Track } from '../models/track.model';

/**
 * Porta de entrada: o que a camada de apresentação pode ler e pedir.
 * Componentes injetam `TRACKS_STORE`, nunca a implementação (NgRx Signal Store).
 */
export interface TracksStorePort {
  readonly isrcs: readonly Isrc[];
  readonly status: Signal<LoadStatus>;
  readonly tracks: Signal<readonly Track[]>;
  readonly notFound: Signal<readonly Isrc[]>;
  readonly failed: Signal<readonly Isrc[]>;
  readonly direction: Signal<SortDirection>;
  readonly source: Signal<DataSource | null>;
  readonly total: Signal<number>;
  readonly availableInBrazil: Signal<number>;
  readonly hasNoPreviews: Signal<boolean>;
  load(): void;
  toggleDirection(): void;
}

export const TRACKS_STORE = new InjectionToken<TracksStorePort>('TracksStore');
