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

  readonly isPlaying = signal(false);
  readonly isImageLoaded = signal(false);
  readonly hasError = signal(false);

  readonly formatDuration = formatDuration;

  isAvailableInBR(): boolean {
    return this.track.available_markets?.includes('BR') || false;
  }

  getThumbnailUrl(): string {
    return this.track.album.images[0]?.url || '';
  }

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

  getArtistNames(): string {
    return this.track.artists.map((artist) => artist.name).join(', ');
  }

  openSpotify(): void {
    window.open(this.track.external_urls.spotify, '_blank');
  }

  ngOnInit(): void {
    const effect = () => {
      const state = this.spotifyService.playbackState();

      if (state.currentTrack?.id === this.track.id) {
        this.isPlaying.set(state.isPlaying);
      } else if (this.isPlaying()) {
        this.isPlaying.set(false);
      }
    };

    effect();

    const interval = setInterval(effect, 1000);
    this.subscription.add({ unsubscribe: () => clearInterval(interval) });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  playOnSpotify(): void {
    this.isPlaying.set(true);

    this.spotifyService.playTrack(this.track.id);

    setTimeout(() => {
      if (!this.spotifyService.isConnected()) {
        window.open(this.track.external_urls.spotify, '_blank');
      }
    }, 1000);
  }

  toggleAudio(): void {
    this.playOnSpotify();
  }

  onImageLoad(): void {
    this.isImageLoaded.set(true);
  }

  onImageError(): void {
    this.hasError.set(true);
  }

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

  toggleMute(): void {}

  onVolumeChange(event: Event): void {}
}
