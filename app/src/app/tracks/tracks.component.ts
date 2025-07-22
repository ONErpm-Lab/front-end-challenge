import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { SpotifyService } from '../core/services/spotify.service';
import { Track } from './track.model';
import { TrackCardComponent } from './track-card.component';

@Component({
  standalone: true,
  selector: 'app-tracks',
  imports: [CommonModule, TrackCardComponent],
  templateUrl: './tracks.component.html',
  styleUrls: ['./tracks.component.scss'],
})
export class TracksComponent implements OnInit, OnDestroy {
  // Lista fixa de ISRCs fornecidos para consulta
  readonly isrcList: string[] = [
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

  // Lista de faixas retornadas da API
  tracks: Track[] = [];
  availableTracks: Track[] = [];
  unavailableTracks: Track[] = [];

  // Serviço do Spotify injetado via função inject (boas práticas Angular 15+)
  private readonly spotifyService = inject(SpotifyService);

  // Subject para controlar ciclo de vida de observables (evita vazamento de memória)
  private readonly destroy$ = new Subject<void>();

  /**
   * Lifecycle hook que inicia a busca pelas faixas ao carregar o componente
   */
  ngOnInit(): void {
    this.spotifyService
      .fetchTracksByISRCList(this.isrcList)
      .pipe(takeUntil(this.destroy$))
      .subscribe((tracks) => {
        const sorted = this.sortTracks(tracks);
        this.tracks = sorted;
        this.availableTracks = sorted.filter((t) => !t.notFound);
        this.unavailableTracks = sorted.filter((t) => t.notFound);
      });
  }

  /**
   * Ordena as faixas por título (ordem alfabética) e move as não encontradas para o fim da lista
   * @param tracks Lista de faixas retornadas da API
   * @returns Lista ordenada de faixas válidas
   */
  private sortTracks(tracks: (Track | null)[]): Track[] {
    return tracks
      .filter((t): t is Track => t !== null)
      .sort((a, b) => {
        if (a.notFound && !b.notFound) return 1;
        if (!a.notFound && b.notFound) return -1;
        return a.title.localeCompare(b.title);
      });
  }

  /**
   * Lifecycle hook que é chamado ao destruir o componente
   * Utilizado para encerrar subscriptions abertas com takeUntil
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
