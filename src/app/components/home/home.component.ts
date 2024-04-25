import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faHeadphones, faQrcode } from '@fortawesome/free-solid-svg-icons';
import { SearchContent } from 'spotify-types';
import isrcList from '../../data/isrc-list.data';
import { SpotifyService } from '../../services/spotify.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule, FontAwesomeModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  private spotifyService = inject(SpotifyService);
  private router = inject(Router);

  protected icons = {
    faQrcode,
    faHeadphones,
  };

  protected get isrcList(): string[] {
    return isrcList;
  }

  protected loadTrackInfo(event: Event, isrc: string) {
    event.preventDefault();

    this.spotifyService.getTrack(isrc).subscribe({
      next: (searchContent) => this.handleSearch(searchContent, isrc),
      error: (error) => console.error(error),
    });
  }

  private handleSearch(searchResult: SearchContent, isrc: string) {
    if (!searchResult.tracks || searchResult.tracks.items.length === 0) {
      console.log('No tracks found');
      return;
    }

    const tracks = searchResult.tracks.items;
    console.log(tracks);
    this.router.navigate(['/track-info', isrc], {
      state: {
        tracks,
      },
    });
  }
}
