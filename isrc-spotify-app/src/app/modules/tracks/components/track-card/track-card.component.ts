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
  readonly isMuted = signal(false);
  readonly currentTime = signal(0);
  readonly duration = signal(0);
  readonly volume = signal(100);

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
          this.startTimeUpdate();
        })
        .catch(() => {
          this.hasError.set(true);
        });
    } else {
      audio.pause();
      this.isPlaying.set(false);
      this.stopTimeUpdate();
    }
  }

  /**
   * Inicia a atualização do tempo
   */
  private startTimeUpdate(): void {
    if (!this.audioElement) return;

    const audio = this.audioElement.nativeElement;

    // Configurar volume inicial
    audio.volume = this.volume() / 100;

    // Atualizar duração quando disponível
    if (audio.duration && !isNaN(audio.duration)) {
      this.duration.set(audio.duration);
    }

    // Event listener para atualização de tempo
    audio.addEventListener('timeupdate', this.updateTime.bind(this));
    audio.addEventListener('loadedmetadata', this.onMetadataLoaded.bind(this));
  }

  /**
   * Para a atualização do tempo
   */
  private stopTimeUpdate(): void {
    if (!this.audioElement) return;

    const audio = this.audioElement.nativeElement;
    audio.removeEventListener('timeupdate', this.updateTime.bind(this));
    audio.removeEventListener('loadedmetadata', this.onMetadataLoaded.bind(this));
  }

  /**
   * Atualiza o tempo atual
   */
  private updateTime(): void {
    if (!this.audioElement) return;

    const audio = this.audioElement.nativeElement;
    if (!isNaN(audio.currentTime)) {
      this.currentTime.set(audio.currentTime);
    }
  }

  /**
   * Callback quando os metadados do áudio são carregados
   */
  private onMetadataLoaded(): void {
    if (!this.audioElement) return;

    const audio = this.audioElement.nativeElement;
    if (audio.duration && !isNaN(audio.duration)) {
      this.duration.set(audio.duration);
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

  /**
   * Obtém a porcentagem de progresso do áudio
   */
  getProgressPercentage(): number {
    if (this.duration() === 0) return 0;
    return (this.currentTime() / this.duration()) * 100;
  }

  /**
   * Formata o tempo em segundos para mm:ss
   */
  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Obtém o tempo atual do áudio
   */
  getCurrentTime(): number {
    return this.currentTime();
  }

  /**
   * Obtém a duração total do áudio
   */
  getDuration(): number {
    return this.duration();
  }

  /**
   * Obtém o volume atual
   */
  getVolume(): number {
    return this.volume();
  }

  /**
   * Alterna o mute do áudio
   */
  toggleMute(): void {
    if (!this.audioElement) return;

    const audio = this.audioElement.nativeElement;
    if (this.isMuted()) {
      audio.muted = false;
      this.isMuted.set(false);
    } else {
      audio.muted = true;
      this.isMuted.set(true);
    }
  }

  /**
   * Handler para mudança de volume
   */
  onVolumeChange(event: Event): void {
    if (!this.audioElement) return;

    const target = event.target as HTMLInputElement;
    const newVolume = parseInt(target.value);

    this.volume.set(newVolume);
    this.audioElement.nativeElement.volume = newVolume / 100;

    // Se o volume for 0, considerar como muted
    if (newVolume === 0) {
      this.isMuted.set(true);
    } else if (this.isMuted()) {
      this.isMuted.set(false);
    }
  }
}
