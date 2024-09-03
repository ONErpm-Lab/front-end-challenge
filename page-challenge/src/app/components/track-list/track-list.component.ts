import { Component, OnInit } from '@angular/core';
import { Track } from '../../interfaces/track.intercafe'
import { SpotifyService } from '../../services/spotify.service';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-track-list',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, ReactiveFormsModule, MatFormFieldModule, MatInputModule],
  templateUrl: './track-list.component.html',
  styleUrls: ['./track-list.component.scss']
})
export class TrackListComponent implements OnInit {
  tracks: Track[] = [];
  isrcControl: FormControl;

  constructor(private spotifyService: SpotifyService, private snackBar: MatSnackBar) {
    this.isrcControl = new FormControl('', [
      Validators.required,
      Validators.pattern(/^[A-Z0-9]{12}$/)
    ]);
  }

  ngOnInit(): void { }

  showWarning(message: string): void {
    this.snackBar.open(message, '', {
      horizontalPosition: 'center',
      duration: 3000,
      verticalPosition: 'bottom',
      panelClass: ['warning-snackbar']
    });
  }

  showError(){
    this.snackBar.open('Erro ao buscar a faixa', '', {
      horizontalPosition: 'center',
      duration:3000,
      verticalPosition: 'bottom',
      panelClass: ['error-snackbar']
    });
  }

  searchTrack(): void {
    this.tracks = [];

    if (this.isrcControl.valid) {
      const isrcInput = this.isrcControl.value;

      this.spotifyService.getTrackByISRC(isrcInput).subscribe(
        (data) => {
          if (data.tracks.items.length > 0) {
            const trackData = data.tracks.items[0];

            const track: Track = {
              name: trackData.name,
              artists: trackData.artists?.map((artist: { name: string; }) => ({ name: artist.name })),
              album: {
                images: trackData.album?.images,
                name: trackData.album?.name,
                release_date: trackData.album?.release_date
              },
              duration_ms: trackData.duration_ms,
              is_playable: trackData.is_playable,
              external_urls: {
                spotify: trackData.external_urls?.spotify
              },
              preview_url: trackData.preview_url,
              available_markets: trackData.available_markets
            };

            this.tracks = [track];
          } else {
            this.showWarning(`Nenhuma faixa encontrada para o ISRC ${isrcInput}`);
          }
        },
        (error) => {
          this.showError();
          console.error('Erro ao buscar a faixa:', error);
        }
      );
    }
  }

  formatDuration(durationMs: number): string {
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  getArtists(artists: { name: string }[]): string {
    return artists.map(artist => artist.name).join(', ');
  }

  isAvailableInBrazil(availableMarkets: string[]): string {
    return availableMarkets.includes('BR') ? 'Sim' : 'Não';
  }
}

// isrcInput = [
//   'US7VG1846811', 'US7QQ1846811', 'BRC310600002',
//   'BR1SP1200071', 'BR1SP1200070', 'BR1SP1500002',
//   'BXKZM1900338', 'BXKZM1900345', 'QZNJX2081700',
//   'QZNJX2078148',
// ]