import { Component, OnInit } from '@angular/core';
import { Track } from '../../interfaces/track.intercafe'
import { SpotifyService } from '../../services/spotify.service';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-track-list',
  standalone: true,
  imports: [NgIf, NgFor, NgClass],
  templateUrl: './track-list.component.html',
  styleUrls: ['./track-list.component.scss']
})
export class TrackListComponent implements OnInit {
  tracks: Track[] = [];
  isrcError:string | null = null
  isrcValid: boolean = false;

  constructor(private spotifyService: SpotifyService, private snackBar: MatSnackBar) { }

  ngOnInit(): void { }

  showWarning(message: string): void {
    this.snackBar.open(message, '', {
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['warning-snackbar']
    });
  }

  showError(){
    this.snackBar.open('Erro ao buscar a faixa', '', {
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['error-snackbar']
    });
  }

  validateISRC(isrc: string): boolean {
    const isrcPattern = /^[A-Z0-9]{12}$/;
    return isrcPattern.test(isrc);
  }

  onISRCChange(isrc: string): void {
    if (this.validateISRC(isrc)) {
      this.isrcValid = true;
      this.isrcError = null;
    } else {
      this.isrcValid = false;
      this.isrcError = 'Código ISRC inválido. O ISRC deve conter 12 caracteres.';
    }
  }

  searchTrack(isrcInput: string): void {
    this.isrcError = null;
    this.tracks = [];
    if (isrcInput && this.isrcValid) {
      this.spotifyService.getTrackByISRC(isrcInput).subscribe(
        (data) => {
          if (data.tracks.items.length > 0) {
            const trackData = data.tracks.items[0];

            const track: Track = {
              name: trackData.name || 'Título não disponível',
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