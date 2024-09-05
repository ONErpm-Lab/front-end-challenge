import { Component, OnInit } from '@angular/core';
import { SpotifyService } from '../services/spotify.service';
import { CardComponent } from '../card/card.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-isrc-list',
  standalone: true,
  imports: [
    CardComponent,
    CommonModule
  ],
  templateUrl: './isrc-list.component.html',
  styleUrl: './isrc-list.component.css'
})
export class IsrcListComponent implements OnInit{
  isrcs= [
    'US7VG1846811',
    'US7QQ1846811',
    'BRC310600002',
    'BR1SP1200071',
    'BR1SP1200070',
    'BR1SP1500002',
    'BXKZM1900338',
    'BXKZM1900345',
    'QZNJX2081700',
    'QZNJX2078148'
  ];

  tracks: any[] = []

  constructor(private spotifyService: SpotifyService){}

  ngOnInit(): void {
    this.fetchTracks();
  }

  fetchTracks() {
    this.spotifyService.authenticate().subscribe({
      next: () => {
        this.isrcs.forEach(isrc => {
          this.spotifyService.searchTrackByISRC(isrc).subscribe({
            next: (response) => {
              console.log(`Resposta para ISRC ${isrc}:`, response);
              const trackData = this.processTrack(response);
              console.log('Dados da faixa processada:', trackData);
              this.tracks.push(trackData);
              console.log('Tracks atualizadas:', this.tracks);
            },
            error: (error) => {
              console.error(`Erro ao buscar ISRC ${isrc}:`, error);
            }
          });
        });
      },
      error: (error) => {
        console.error('Erro na autenticação:', error);
      }
    });
  }

  processTrack(track: any) {
    console.log('Processando track:', track);
    return {
      thumbUrl: track.album.images[0]?.url,
      title: track.name,
      releaseDate: track.album.release_date,
      artists: this.getArtists(track.artists),
      duration: this.formatDuration(track.duration_ms),
      previewUrl: track.preview_url,
      spotifyUrl: track.external_urls.spotify,
      isAvailableInBR: track.available_markets.includes('BR')
    };
  }

  getArtists(artists: any[]): string[] {
    return artists.map(artist => artist.name);
  }

  formatDuration(durationMs: number) {
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }
}

