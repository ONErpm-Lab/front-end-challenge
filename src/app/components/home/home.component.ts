import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { SearchContent } from 'spotify-types';
import isrcList from '../../data/isrc-list.data';
import { SpotifyService } from '../../services/spotify.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  private spotifyService = inject(SpotifyService);
  private router = inject(Router);

  public get isrcList(): string[] {
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
