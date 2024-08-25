import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SpotifyService } from './services/spotify.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = 'challenge-project';

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
          this.tracks.push({ isrc, ...track.tracks.items });
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
