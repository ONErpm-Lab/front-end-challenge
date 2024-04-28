import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import isrcList from '../../data/isrc-list.data';
import MultiTrack from '../../services/multi-track.interface';
import { SpotifyService } from '../../services/spotify.service';
import { TrackCardComponent } from '../track-card/track-card.component';

@Component({
  selector: 'app-tracks',
  standalone: true,
  imports: [AsyncPipe, TrackCardComponent],
  templateUrl: './tracks.component.html',
  styleUrl: './tracks.component.scss',
})
export class TracksComponent {
  protected multiTtracks$: Observable<MultiTrack[]>;

  constructor(private spotifyService: SpotifyService) {
    this.multiTtracks$ = spotifyService.getAllTracks(isrcList);
  }
}
