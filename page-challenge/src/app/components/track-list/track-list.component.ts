import { Component, OnInit } from '@angular/core';
import { Track } from '../../interfaces/track.intercafe'
import { SpotifyService } from '../../services/spotify.service';
import { NgFor, NgIf } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-track-list',
  standalone: true,
  imports: [NgIf, NgFor],
  templateUrl: './track-list.component.html',
  styleUrls: ['./track-list.component.scss']
})
export class TrackListComponent implements OnInit {
  tracks: Track[] = [];

  constructor(private spotifyService: SpotifyService, private snackBar: MatSnackBar) { }

  ngOnInit(): void { }

  showWarning(message: string): void {
    this.snackBar.open(message, '', {
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['alert-warning']
    });
  }

  searchTrack(isrcInput: string): void {
    if (isrcInput) {
      this.spotifyService.getTrackByISRC(isrcInput).subscribe(
        (data) => {
          if (data.tracks.items.length > 0) {
            const trackData = data.tracks.items[0]; // Acessa o primeiro item da lista

            const track: Track = {
              name: trackData.name || 'Título não disponível',
              artists: trackData.artists?.map((artist: { name: string; }) => ({ name: artist.name })) || [{ name: 'Artista não disponível' }],
              album: {
                images: trackData.album?.images,
                name: trackData.album?.name,
                release_date: trackData.album?.release_date
              },
              duration_ms: trackData.duration_ms || 0,
              is_playable: trackData.is_playable,
              external_urls: {
                spotify: trackData.external_urls?.spotify 
              },
              preview_url: trackData.preview_url || null,
              available_markets: trackData.available_markets
            };

            this.tracks = [track];
          } else {
            this.showWarning(`Nenhuma faixa encontrada para o ISRC ${isrcInput}`);
          }
        },
        (error) => {
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