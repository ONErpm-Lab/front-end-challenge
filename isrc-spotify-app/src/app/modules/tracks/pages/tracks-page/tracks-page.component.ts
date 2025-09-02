import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';

import { TrackCardComponent } from '../../components/track-card/track-card.component';
import { TracksService } from '../../services/tracks.service';
import { ITrack } from '../../models';
import { LayoutComponent } from '../../../../components/layout/layout.component';
import { ISRCCodes } from '../../../../core';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-tracks-page',
  standalone: true,
  imports: [
    CommonModule,
    NgxSkeletonLoaderModule,
    TrackCardComponent,
    LayoutComponent,
    TranslatePipe,
  ],
  templateUrl: './tracks-page.component.html',
  styleUrls: ['./tracks-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TracksPageComponent implements OnInit {
  private readonly tracksService = inject(TracksService);

  readonly tracks$ = this.tracksService.data$;
  readonly loading$ = this.tracksService.loading$;
  readonly error$ = this.tracksService.error$;

  readonly allISRCs: string[] = Object.values(ISRCCodes);

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

  getNotFoundISRCs(tracks: ITrack[]): string[] {
    const foundISRCs = tracks.map((track) => track.isrc);
    return this.allISRCs.filter((isrc) => !foundISRCs.includes(isrc));
  }

  /**
   * Retorna as tracks ordenadas alfabeticamente
   */
  getSortedTracks(tracks: ITrack[]): ITrack[] {
    return [...tracks].sort((a, b) => a.name.localeCompare(b.name));
  }
}
