import { Component, OnInit } from '@angular/core';
import { SpotifyService } from '../../services/spotify.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.component.html',
  styleUrl: './card.component.css',
})
export class CardComponent implements OnInit {
  artistData: any;
  trackData: any;
  track: any[] = [];

  isrcs: string[] = [
    'US7VG1846811',
    'US7QQ1846811',
    'BRC310600002',
    'BR1SP1200071',
    'BR1SP1200070',
    'BR1SP1500002',
    'BXKZM1900338',
    'BXKZM1900345',
    'QZNJX2081700',
    'QZNJX2078148',
  ];

  tracks: any[] = [];
  noDataTracks: any[] = [];

  getArtists(track: any): string {
    return track.artists
      ? track.artists.map((a: any) => a.name).join(', ')
      : 'Desconhecido';
  }

  constructor(private spotifyService: SpotifyService) {}
  ngOnInit(): void {
    this.isrcs.forEach((isrc) => {
      this.spotifyService.getTrackData(isrc).subscribe({
        next: (track) => {
          console.log(track);
          if (track.tracks.items.length > 0) {
            this.tracks.push(track.tracks.items[0]);
            this.sortTracks();
          } else {
            this.noDataTracks.push(isrc);
          }
        },
        error: (error) => {
          console.log('ERRO');
          console.log(error);
        },
      });
    });

    this.sortTracks();
  }

  private sortTracks(): void {
    this.tracks.sort((a, b) => {
      const nameA = a.name ? a.name.toLowerCase() : '';
      const nameB = b.name ? b.name.toLowerCase() : '';
      return nameA.localeCompare(nameB);
    });
  }
}
