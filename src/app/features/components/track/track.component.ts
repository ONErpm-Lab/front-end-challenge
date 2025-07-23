import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Track } from '../../model/track.interface';
import { SpotifyService } from '../../services/spotify.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-track',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './track.component.html',
  styleUrl: './track.component.css',
})
export class TrackComponent {
  tracks: Track[] = [];
  isLoading = true;
  error: string | null = null;
  private subscription = new Subscription();

  constructor(private spotifyService: SpotifyService) {}

  ngOnInit() {
    this.spotifyService.getAllTracks().subscribe();

    this.subscription.add(
      this.spotifyService.tracks$.subscribe({
        next: (tracks) => {
          this.tracks = tracks;
          this.isLoading = false;
          console.log('Tracks buscadas:', this.tracks);
        },
        error: (error) => {
          this.error =
            'Erro ao carregar as faixas. Tente novamente mais tarde.';
          this.isLoading = false;
          console.error('Error tracks:', error);
        },
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  selectTrack(track: Track) {
    this.spotifyService.setCurrentTrack(track);
  }

  formatDuration(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  getArtistsNames(artists: { name: string }[]): string {
    return artists.map((artist) => artist.name).join(', ');
  }
}
