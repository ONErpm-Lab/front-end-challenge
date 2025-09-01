import { Component, Input, ChangeDetectionStrategy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ITrack } from '../../models';
import { formatDuration } from '../../../../core';

@Component({
  selector: 'app-track-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './track-card.component.html',
  styleUrls: ['./track-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrackCardComponent {
  @Input({ required: true }) track!: ITrack;
  @ViewChild('audio', { static: true }) audioElement!: ElementRef<HTMLAudioElement>;

  // Utilitários para o template
  readonly formatDuration = formatDuration;

  /**
   * Verifica se a track está disponível no Brasil
   */
  isAvailableInBR(): boolean {
    return this.track.available_markets.includes('BR');
  }

  /**
   * Obtém a URL da thumbnail (preferência para a segunda imagem)
   */
  getThumbnailUrl(): string {
    return this.track.album.images[1]?.url || this.track.album.images[0]?.url || '';
  }

  /**
   * Formata a data de lançamento baseada na precisão
   */
  formatReleaseDate(): string {
    const date = new Date(this.track.album.release_date);
    const precision = this.track.album.release_date_precision;

    switch (precision) {
      case 'day':
        return date.toLocaleDateString('pt-BR');
      case 'month':
        return date.toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' });
      case 'year':
        return date.getFullYear().toString();
      default:
        return this.track.album.release_date;
    }
  }

  /**
   * Obtém os nomes dos artistas separados por vírgula
   */
  getArtistNames(): string {
    return this.track.artists.map((artist) => artist.name).join(', ');
  }

  /**
   * Abre o Spotify em nova aba
   */
  openSpotify(): void {
    window.open(this.track.external_urls.spotify, '_blank');
  }

  /**
   * Controle de áudio
   */
  toggleAudio(): void {
    if (this.audioElement.nativeElement.paused) {
      this.audioElement.nativeElement.play();
    } else {
      this.audioElement.nativeElement.pause();
    }
  }
}
