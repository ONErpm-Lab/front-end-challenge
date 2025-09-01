import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrackCardComponent } from '../../components/track-card/track-card.component';
import { TracksService } from '../../services/tracks.service';
import { ITrack } from '../../models';

@Component({
  selector: 'app-tracks-page',
  standalone: true,
  imports: [CommonModule, TrackCardComponent],
  templateUrl: './tracks-page.component.html',
  styleUrls: ['./tracks-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TracksPageComponent implements OnInit {
  private readonly tracksService = inject(TracksService);

  readonly tracks$ = this.tracksService.data$;
  readonly loading$ = this.tracksService.loading$;
  readonly error$ = this.tracksService.error$;

  ngOnInit(): void {
    this.tracksService.loadAllTracks().subscribe();
  }

  reloadTracks(): void {
    this.tracksService.reloadTracks().subscribe();
  }

  clearError(): void {
    this.tracksService.clearError();
  }

  trackByISRC(index: number, track: ITrack): string {
    return track.isrc;
  }
}
