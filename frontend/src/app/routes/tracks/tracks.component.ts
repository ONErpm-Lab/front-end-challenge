import type { Track } from 'src/app/models/interfaces';

import { Component } from '@angular/core';
import { Observable, map } from 'rxjs';
import { FetchTracksService, SortTracksService } from 'src/app/services';
@Component({
  selector: 'app-tracks',
  templateUrl: './tracks.component.html',
  styleUrls: ['./tracks.component.scss']
})
export class TracksComponent {
  tracks$: Observable<{ data: Track[] }>;
  isLoading: boolean = true;

  constructor(
    private fetchTracksService: FetchTracksService,
    private sortTracksService: SortTracksService
  ) {
    this.tracks$ = this.fetchTracksService.fetchTracks().pipe(
      map((response: { data: Track[] }) => ({
        data: this.sortTracksService.sortTracksByName(response.data)
      }))
    );
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
