import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Track } from '../../model/track.interface';
import { Subscription } from 'rxjs';
import { SpotifyService } from '../../services/spotify.service';

@Component({
  selector: 'app-player',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './player.component.html',
  styleUrl: './player.component.css',
})
export class PlayerComponent {
  currentTrack: Track | null = null;
  currentTime = 0;
  duration = 0;
  isPlaying = false;
  subscription = new Subscription();

  constructor(private spotifyService: SpotifyService) {}

  ngOnInit() {
    this.subscription.add(
      this.spotifyService.currentTrack$.subscribe((track) => {
        this.currentTrack = track;
        this.duration = track?.duration_ms ? track.duration_ms : 0;
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  openSpotify() {
    if (this.currentTrack?.external_urls?.spotify) {
      window.open(this.currentTrack.external_urls.spotify, '_blank');
    }
  }

  formatTime(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  getArtistsNames(artists: { name: string }[]): string {
    return (
      artists.map((artist) => artist.name).join(', ') ||
      'Artista não encontrado'
    );
  }
}
