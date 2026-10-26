import { Dialog } from '@angular/cdk/dialog';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Overlay } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoPipe } from '@jsverse/transloco';
import { map } from 'rxjs';
import { CopyButtonComponent } from '../../../../shared/components/copy-button/copy-button.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { CatalogSummaryComponent } from '../../components/catalog-summary/catalog-summary.component';
import { DetailSheetComponent } from '../../components/detail-sheet/detail-sheet.component';
import { IsrcListDialogComponent } from '../../components/isrc-list-dialog/isrc-list-dialog.component';
import { IsrcListDialogData } from '../../components/isrc-list-dialog/isrc-list-dialog.interfaces';
import { TrackDetailComponent } from '../../components/track-detail/track-detail.component';
import { TracksTableComponent } from '../../components/tracks-table/tracks-table.component';
import { TrackPick } from '../../components/tracks-table/tracks-table.interfaces';
import { TracksToolbarComponent } from '../../components/tracks-toolbar/tracks-toolbar.component';
import { UnavailablePanelComponent } from '../../components/unavailable-panel/unavailable-panel.component';
import { LookupStatus } from '../../../../models/tracks.enums';
import { TracksStore } from '../../store/tracks.store';
import { SHEET_BREAKPOINT } from './catalog-page.constants';

/**
 * The catalog: the summary cards, the table with its filters and the detail of the track in focus (a panel on
 * wide screens, a bottom sheet on phones). When Spotify cannot be reached the page says so and offers a retry.
 */
@Component({
  selector: 'orp-catalog-page',
  imports: [
    TranslocoPipe,
    IconComponent,
    CopyButtonComponent,
    CatalogSummaryComponent,
    TracksToolbarComponent,
    TracksTableComponent,
    TrackDetailComponent,
    UnavailablePanelComponent,
  ],
  templateUrl: './catalog-page.component.html',
  styleUrl: './catalog-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogPageComponent {
  protected readonly store = inject(TracksStore);
  private readonly _dialog = inject(Dialog);
  private readonly _overlay = inject(Overlay);

  /** Phones get the detail in a sheet (the panel beside the table is hidden there). */
  protected readonly usesSheet = toSignal(
    inject(BreakpointObserver)
      .observe(SHEET_BREAKPOINT)
      .pipe(map((state) => state.matches)),
    { initialValue: false },
  );

  /** The ISRCs of the tracks, for "copy all". */
  protected readonly foundIsrcs = computed(() =>
    this.store
      .items()
      .filter((result) => result.status === LookupStatus.FOUND)
      .map((result) => result.isrc)
      .join('\n'),
  );

  protected onPick(pick: TrackPick): void {
    if (!this.usesSheet()) {
      return;
    }
    this._dialog.open(DetailSheetComponent, {
      ariaLabelledBy: 'detail-sheet-title',
      positionStrategy: this._overlay.position().global().bottom('0').centerHorizontally(),
      maxWidth: '100vw',
      panelClass: 'orp-sheet-panel',
      backdropClass: 'orp-dialog-backdrop',
      restoreFocus: pick.opener,
    });
  }

  protected showFailed(): void {
    this._openList({
      titleKey: 'status.affectedTitle',
      hintKey: 'status.affectedHint',
      isrcs: this.store.failedIsrcs(),
      retry: () => this.store.reload(),
    });
  }

  protected showNotFound(): void {
    this._openList({
      titleKey: 'list.missingTitle',
      hintKey: 'list.missingHint',
      isrcs: this.store.notFoundIsrcs(),
    });
  }

  private _openList(data: IsrcListDialogData): void {
    this._dialog.open(IsrcListDialogComponent, {
      data,
      ariaLabelledBy: 'isrc-dialog-title',
      backdropClass: 'orp-dialog-backdrop',
      panelClass: 'orp-dialog-panel',
    });
  }
}
