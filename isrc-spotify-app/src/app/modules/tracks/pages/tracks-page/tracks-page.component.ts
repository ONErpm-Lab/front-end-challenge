import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { FormsModule } from '@angular/forms';
import { TrackCardComponent } from '../../components/track-card/track-card.component';
import { TracksService } from '../../services/tracks.service';
import { ITrack } from '../../models';
import { LayoutComponent } from '../../../../components/layout/layout.component';
import { ISRCCodes } from '../../../../core';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-tracks-page',
  standalone: true,
  imports: [
    CommonModule,
    NgxSkeletonLoaderModule,
    FormsModule,
    TrackCardComponent,
    LayoutComponent,
    TranslatePipe,
  ],
  templateUrl: './tracks-page.component.html',
  styleUrls: ['./tracks-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TracksPageComponent implements OnInit {
  private readonly tracksService = inject(TracksService);

  readonly tracks$ = this.tracksService.data$;
  readonly loading$ = this.tracksService.loading$;
  readonly error$ = this.tracksService.error$;

  // Estado de busca
  readonly searchTerm = signal('');
  readonly searchResults$ = signal<ITrack[]>([]);
  readonly isSearching = signal(false);

  // Lista de ISRCs não encontrados (será calculada no template)
  readonly allISRCs: string[] = Object.values(ISRCCodes);

  ngOnInit(): void {
    this.tracksService.loadAllTracks().subscribe();
  }

  reloadTracks(): void {
    this.tracksService.reloadTracks().subscribe();
  }

  clearError(): void {
    this.tracksService.clearError();
  }

  trackByISRC(index: number, track: ITrack): string {
    return track.isrc;
  }

  getNotFoundISRCs(tracks: ITrack[]): string[] {
    const foundISRCs = tracks.map((track) => track.isrc);
    return this.allISRCs.filter((isrc) => !foundISRCs.includes(isrc));
  }

  /**
   * Filtra tracks baseado no termo de busca e ordena alfabeticamente
   */
  getFilteredTracks(tracks: ITrack[]): ITrack[] {
    const search = this.searchTerm().toLowerCase().trim();

    let filteredTracks: ITrack[];

    if (!search) {
      filteredTracks = tracks;
    } else if (this.searchResults$().length > 0) {
      // Se há resultados de busca, retorna eles
      filteredTracks = this.searchResults$();
    } else {
      // Caso contrário, filtra localmente
      filteredTracks = tracks.filter(
        (track) =>
          track.isrc.toLowerCase().includes(search) ||
          track.name.toLowerCase().includes(search) ||
          track.artists.some((artist) => artist.name.toLowerCase().includes(search)) ||
          track.album.name.toLowerCase().includes(search)
      );
    }

    // Ordena alfabeticamente por título da faixa
    return filteredTracks.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Handler para input de busca
   */
  onSearchInput(): void {
    const search = this.searchTerm().trim();

    if (!search) {
      this.searchResults$.set([]);
      this.isSearching.set(false);
      return;
    }

    this.isSearching.set(true);

    // Usar o serviço para buscar
    this.tracksService.searchTracksByTerm(search).subscribe({
      next: (results) => {
        this.searchResults$.set(results);
        this.isSearching.set(false);
      },
      error: () => {
        this.searchResults$.set([]);
        this.isSearching.set(false);
      },
    });
  }

  /**
   * Limpa o campo de busca
   */
  clearSearch(): void {
    this.searchTerm.set('');
    this.searchResults$.set([]);
    this.isSearching.set(false);
  }
}
