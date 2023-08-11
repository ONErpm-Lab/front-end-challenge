import type { Track } from 'src/app/models/interfaces';

import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { FetchTracksService } from 'src/app/services';
@Component({
  selector: 'app-tracks',
  templateUrl: './tracks.component.html',
  styleUrls: ['./tracks.component.scss']
})
export class TracksComponent {
  tracks$: Observable<{ data: Track[] }>;
  isLoading: boolean = true;

  constructor(private fetchTracksService: FetchTracksService) {
    this.tracks$ = this.fetchTracksService.fetchTracks();
    this.tracks$.subscribe({
      next: () => this.isLoading = false,
      error: (error) => {
        this.isLoading = false;
        alert(error);
        console.error(error);
      }
    });
  }
}
