import {
  Component,
  Input,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { ITrack } from '../../models';
import { formatDuration } from '../../../../core';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-track-card',
  standalone: true,
  imports: [CommonModule, NgxSkeletonLoaderModule, TranslatePipe],
  templateUrl: './track-card.component.html',
  styleUrls: ['./track-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrackCardComponent {
  @Input({ required: true }) track!: ITrack;
  @ViewChild('audio', { static: false }) audioElement?: ElementRef<HTMLAudioElement>;

  // Estados do componente
  readonly isPlaying = signal(false);
  readonly isImageLoaded = signal(false);
  readonly hasError = signal(false);

  // Utilitários para o template
  readonly formatDuration = formatDuration;

  /**
   * Verifica se a track está disponível no Brasil
   */
  isAvailableInBR(): boolean {
    return this.track.available_markets?.includes('BR') || false;
  }

  /**
   * Obtém a URL da thumbnail (primeira imagem disponível)
   */
  getThumbnailUrl(): string {
    return this.track.album.images[0]?.url || '';
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
    if (!this.audioElement || !this.track.preview_url) return;

    const audio = this.audioElement.nativeElement;

    if (audio.paused) {
      audio
        .play()
        .then(() => {
          this.isPlaying.set(true);
        })
        .catch(() => {
          this.hasError.set(true);
        });
    } else {
      audio.pause();
      this.isPlaying.set(false);
    }
  }

  /**
   * Callback quando a imagem carrega
   */
  onImageLoad(): void {
    this.isImageLoaded.set(true);
  }

  /**
   * Callback quando a imagem falha
   */
  onImageError(): void {
    this.hasError.set(true);
  }

  /**
   * Callback quando o áudio termina
   */
  onAudioEnded(): void {
    this.isPlaying.set(false);
  }
}
