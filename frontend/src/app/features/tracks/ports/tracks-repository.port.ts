import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { Isrc } from '../models/isrc.value-object';
import type { TracksResult } from '../models/track.model';

/**
 * Porta de saída: de onde o store obtém as faixas.
 * O store depende deste contrato; a implementação HTTP é ligada em `provideTracksFeature()`.
 */
export interface TracksRepository {
  getTracks(isrcs: readonly Isrc[]): Observable<TracksResult>;
}

export const TRACKS_REPOSITORY = new InjectionToken<TracksRepository>('TracksRepository');
