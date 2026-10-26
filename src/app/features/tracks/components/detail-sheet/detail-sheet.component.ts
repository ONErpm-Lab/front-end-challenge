import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { NowPlayingService } from '../../store/now-playing.service';
import { TrackDetailComponent } from '../track-detail/track-detail.component';

/**
 * The detail of the track as a bottom sheet (phones). A CDK dialog: focus trapped, Escape closes it and the focus
 * goes back to the row. Closing it stops the preview, which lives inside it.
 */
@Component({
  selector: 'orp-detail-sheet',
  imports: [TrackDetailComponent],
  templateUrl: './detail-sheet.component.html',
  styleUrl: './detail-sheet.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailSheetComponent {
  private readonly _ref = inject(DialogRef);

  constructor() {
    // The preview lives in the sheet: closing the sheet stops it.
    const nowPlaying = inject(NowPlayingService);
    inject(DestroyRef).onDestroy(() => nowPlaying.stop(false));
  }

  protected close(): void {
    this._ref.close();
  }
}
