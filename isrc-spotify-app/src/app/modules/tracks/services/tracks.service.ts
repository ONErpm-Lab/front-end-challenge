import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
import { map, catchError, tap, startWith } from 'rxjs/operators';
import { ITrack } from '../models';
import { SpotifyGatewayFactory, sortByTitlePTBR } from '../../../core';

export interface ITracksState {
  tracks: Array<ITrack>;
  loading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class TracksService {
  private readonly spotifyFactory = inject(SpotifyGatewayFactory);

  private readonly stateSubject = new BehaviorSubject<ITracksState>({
    tracks: [],
    loading: false,
    error: null,
  });

  // ISRCs fixos do desafio
  private readonly isrcCodes: Array<string> = [
    'US7VG1846811',
    'US7QQ1846811',
    'BRC310600002',
    'BR1SP1200071',
    'BR1SP1200070',
    'BR1SP1500002',
    'BXKZM1900338',
    'BXKZM1900345',
    'QZNJX2081700',
    'QZNJX2078148',
  ];

  // Observables públicos
  readonly tracks$ = this.stateSubject.pipe(map((state) => state.tracks));
  readonly loading$ = this.stateSubject.pipe(map((state) => state.loading));
  readonly error$ = this.stateSubject.pipe(map((state) => state.error));

  // Estado completo
  readonly state$ = this.stateSubject.asObservable();

  /**
   * Carrega todas as tracks por ISRC
   */
  loadAllTracks(): Observable<Array<ITrack>> {
    this.updateState({ loading: true, error: null });

    const gateway = this.spotifyFactory.getGateway();

    return gateway.searchTracksByISRCsObservable(this.isrcCodes).pipe(
      tap((tracks) => {
        const sortedTracks = sortByTitlePTBR(tracks);
        this.updateState({
          tracks: sortedTracks,
          loading: false,
          error: null,
        });
      }),
      catchError((error) => {
        const errorMessage = error.message || 'Erro ao carregar tracks';
        this.updateState({
          tracks: [],
          loading: false,
          error: errorMessage,
        });
        return of([]);
      })
    );
  }

  /**
   * Recarrega as tracks (útil para botão "Tentar novamente")
   */
  reloadTracks(): Observable<Array<ITrack>> {
    return this.loadAllTracks();
  }

  /**
   * Busca track específica por ISRC
   */
  getTrackByISRC(isrc: string): Observable<ITrack | null> {
    const gateway = this.spotifyFactory.getGateway();
    return gateway.searchTrackByISRCObservable(isrc);
  }

  /**
   * Filtra tracks por disponibilidade no Brasil
   */
  getTracksByAvailability(availableInBR: boolean): Observable<Array<ITrack>> {
    return this.tracks$.pipe(
      map((tracks) =>
        tracks.filter((track) =>
          availableInBR
            ? track.available_markets.includes('BR')
            : !track.available_markets.includes('BR')
        )
      )
    );
  }

  /**
   * Filtra tracks por artista
   */
  getTracksByArtist(artistName: string): Observable<Array<ITrack>> {
    return this.tracks$.pipe(
      map((tracks) =>
        tracks.filter((track) =>
          track.artists.some((artist) =>
            artist.name.toLowerCase().includes(artistName.toLowerCase())
          )
        )
      )
    );
  }

  /**
   * Limpa o estado de erro
   */
  clearError(): void {
    this.updateState({ error: null });
  }

  /**
   * Atualiza o estado interno
   */
  private updateState(partial: Partial<ITracksState>): void {
    const currentState = this.stateSubject.value;
    this.stateSubject.next({ ...currentState, ...partial });
  }
}
