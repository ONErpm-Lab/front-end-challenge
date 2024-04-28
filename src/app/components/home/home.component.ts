import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faHeadphones, faQrcode } from '@fortawesome/free-solid-svg-icons';
import { SearchContent } from 'spotify-types';
import isrcList from '../../data/isrc-list.data';
import { SpotifyService } from '../../services/spotify.service';
import { ModalComponent } from '../modal/modal.component';
import { fadeInOutAnimation } from './fade-in-out.animation';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule, FontAwesomeModule, ModalComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  animations: [fadeInOutAnimation],
})
export class HomeComponent {
  constructor(private spotifyService: SpotifyService, private router: Router) {}

  protected showModal = false;

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
    console.log('entrei');

    if (!searchResult.tracks || searchResult.tracks.items.length === 0) {
      this.showModal = true;
      console.log('dei errado');
      return;
    }

    console.log('dei certo');

    const tracks = searchResult.tracks.items;
    this.router.navigate(['/track-info', isrc], {
      state: {
        tracks,
      },
    });
  }
}
