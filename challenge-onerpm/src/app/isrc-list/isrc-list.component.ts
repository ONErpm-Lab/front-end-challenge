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
        let requestsCompleted = 0;
  
        this.isrcs.forEach(isrc => {
          this.spotifyService.searchTrackByISRC(isrc).subscribe({
            next: (response) => {
              if (response && response.tracks && response.tracks.items && response.tracks.items.length > 0) {
                const track = response.tracks.items[0];
                const trackData = this.processTrack(track);
                if (trackData) {
                  this.tracks.push(trackData);
                }
              } else {
                const fallbackTrack = this.createFallbackTrack(isrc);
                this.tracks.push(fallbackTrack);
              }

              requestsCompleted++;
              if (requestsCompleted === this.isrcs.length) {
                this.tracks.sort((a, b) => a.title.localeCompare(b.title)); 
              }
            },
            error: (error) => {
              console.error(`Erro ao buscar ISRC ${isrc}:`, error);
              const fallbackTrack = this.createFallbackTrack(isrc, error.message);
              this.tracks.push(fallbackTrack);
  
              requestsCompleted++;
              if (requestsCompleted === this.isrcs.length) {
                this.tracks.sort((a, b) => a.title.localeCompare(b.title)); 
              }
            }
          });
        });
      },
      error: (error) => {
        console.error('Erro na autenticação:', error);
      }
    });
  }
  

  createFallbackTrack(isrc: string, errorMessage: string = 'ISRC não encontrado') {
    return {
      thumbUrl: 'assets/default-image.png',
      title: errorMessage,
      releaseDate: 'Informação não disponível',
      artists: [`ISRC: ${isrc}`],
      duration: 'Informação não disponível',
      previewUrl: null,
      spotifyUrl: null,
      isAvailableInBR: 'unknown'
    };
  }

  processTrack(track: any) {

    const defaultImage = 'assets/default-image.png';
    const defaultArtist = 'Informação não encontrada';
    const defaultText = 'Informação não encontrada';

    const images = track.album?.images || [];
    const thumbUrl = images.length > 0 ? images[0]?.url : defaultImage;

    const title = track.name || defaultText;
    const releaseDate = track.album?.release_date || defaultText;
    const artists = track.artists?.map((artist: any) => artist.name) || [defaultArtist];
    const duration = track.duration_ms ? this.formatDuration(track.duration_ms) : defaultText;
    const previewUrl = track.preview_url || null;
    const spotifyUrl = track.external_urls?.spotify || null;
    const isAvailableInBR = track.available_markets
    ? track.available_markets.includes('BR')
      ? 'available'
      : 'not-available'
    : 'unknown';

    return {
      thumbUrl,
      title,
      releaseDate,
      artists,
      duration,
      previewUrl,
      spotifyUrl,
      isAvailableInBR
    };
  }  

  getArtists(artists: any[]): string[] {
    return artists && artists.length > 0 ? artists.map(artist => artist.name) : ['Informação não encontrada'];
  }

  formatDuration(durationMs: number) {
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }
}

