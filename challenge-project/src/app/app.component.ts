import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SpotifyService } from './services/spotify.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = 'challenge-project';

  artistData: any;

  constructor(private spotifyService: SpotifyService) {}
  ngOnInit(): void {
    this.spotifyService.getArtistData('4Z8W4fKeB5YxbusRsdQVPb').subscribe({
      next: (data) => {
        this.artistData = data;
        console.log('Artist data:', this.artistData);
      },
      error: (error) => {
        console.error('API connection failed', error);
      },
    });
  }
}
