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

    this.spotifyService.getTrackData('QZNJX2078148').subscribe({
      next: (data) => {
        console.log('RETORNO OK');
        console.log(data);
        if (data.tracks.items.length > 0) {
          this.trackData = data.tracks.items[0];
          console.log(this.trackData);
        } else {
          console.log('não possui');
        }
      },
      error: (error) => {
        console.log('ERRO');
        console.log(error);
      },
    });
  }
}
