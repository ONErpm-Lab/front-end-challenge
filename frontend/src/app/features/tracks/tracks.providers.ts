import { inject, type Provider } from '@angular/core';
import { TRACKS_REPOSITORY } from './ports/tracks-repository.port';
import { TRACKS_STORE, type TracksStorePort } from './ports/tracks-store.port';
import { TrackApiService } from './services/track-api.service';
import { TracksSignalStore } from './store/tracks.store';

/**
 * Raiz de composição da feature: o ÚNICO lugar que conhece as implementações.
 * Trocar o store (ou a origem dos dados) = mudar este arquivo; páginas e componentes não mudam.
 */
export function provideTracksFeature(): Provider[] {
  return [
    TracksSignalStore,
    // useFactory tipado: o compilador garante que a implementação cumpre a porta.
    { provide: TRACKS_STORE, useFactory: (): TracksStorePort => inject(TracksSignalStore) },
    { provide: TRACKS_REPOSITORY, useExisting: TrackApiService },
  ];
}
