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

  getArtists(track: any): string {
    return track.artists
      ? track.artists.map((a: any) => a.name).join(', ')
      : 'Desconhecido';
  }

  constructor(private spotifyService: SpotifyService) {}
  ngOnInit(): void {
    /*
    this.spotifyService.getArtistData('4Z8W4fKeB5YxbusRsdQVPb').subscribe({
      next: (data) => {
        this.artistData = data;
        console.log('Artist data:', this.artistData);
      },
      error: (error) => {
        console.error('API connection failed', error);
      },
    });
  */

    this.isrcs.forEach((isrc) => {
      this.spotifyService.getTrackData(isrc).subscribe({
        next: (track) => {
          this.tracks.push({ isrc, ...track.tracks.items[0] });
        },
        error: (error) => {
          console.log('ERRO');
          console.log(error);
        },
      });
    });

    console.log(this.tracks);
  }
}
