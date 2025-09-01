import {
  Component,
  Input,
  ChangeDetectionStrategy,
  signal,
  inject,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { ITrack } from '../../models';
import { formatDuration } from '../../../../core';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { SpotifyPlaybackService } from '../../../../core/services/spotify-playback.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-track-card',
  standalone: true,
  imports: [CommonModule, NgxSkeletonLoaderModule, TranslatePipe],
  templateUrl: './track-card.component.html',
  styleUrls: ['./track-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrackCardComponent implements OnInit, OnDestroy {
  @Input({ required: true }) track!: ITrack;

  private readonly spotifyService = inject(SpotifyPlaybackService);
  private subscription = new Subscription();

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

  ngOnInit(): void {
    // Observa mudanças no estado de reprodução do Spotify
    // Usa um effect para reagir às mudanças do signal
    const effect = () => {
      const state = this.spotifyService.playbackState();
      // Atualiza o estado de reprodução baseado no Spotify
      if (state.currentTrack?.id === this.track.id) {
        this.isPlaying.set(state.isPlaying);
      } else if (this.isPlaying()) {
        // Se não é a faixa atual, para de tocar
        this.isPlaying.set(false);
      }
    };

    // Executa o effect inicialmente
    effect();

    // Adiciona um listener para mudanças (simulado)
    const interval = setInterval(effect, 1000);
    this.subscription.add({ unsubscribe: () => clearInterval(interval) });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  /**
   * Simula o play no Spotify (abre em nova aba)
   */
  playOnSpotify(): void {
    this.isPlaying.set(true);

    // Tenta reproduzir via Spotify Web Playback SDK
    this.spotifyService.playTrack(this.track.id);

    // Fallback: abre o Spotify em nova aba se não conseguir conectar
    setTimeout(() => {
      if (!this.spotifyService.isConnected()) {
        window.open(this.track.external_urls.spotify, '_blank');
      }
    }, 1000);
  }

  /**
   * Controle de áudio (simulado para Spotify)
   */
  toggleAudio(): void {
    this.playOnSpotify();
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
   * Métodos simplificados para compatibilidade
   */
  getProgressPercentage(): number {
    return 0;
  }

  formatTime(seconds: number): string {
    return '0:00';
  }

  getCurrentTime(): number {
    return 0;
  }

  getDuration(): number {
    return 0;
  }

  getVolume(): number {
    return 100;
  }

  toggleMute(): void {
    // Não implementado para Spotify
  }

  onVolumeChange(event: Event): void {
    // Não implementado para Spotify
  }
}
