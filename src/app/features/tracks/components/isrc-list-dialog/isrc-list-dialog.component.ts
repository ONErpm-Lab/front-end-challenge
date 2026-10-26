import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { CopyButtonComponent } from '../../../../shared/components/copy-button/copy-button.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { IsrcListDialogData } from './isrc-list-dialog.interfaces';

/**
 * A list of ISRCs in a modal (the ones that failed, or the ones Spotify does not know): copy one, copy all and,
 * for failures, try again. The CDK dialog traps the focus, closes on Escape and gives the focus back.
 */
@Component({
  selector: 'orp-isrc-list-dialog',
  imports: [TranslocoPipe, CopyButtonComponent, IconComponent],
  templateUrl: './isrc-list-dialog.component.html',
  styleUrl: './isrc-list-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IsrcListDialogComponent {
  protected readonly data = inject<IsrcListDialogData>(DIALOG_DATA);
  private readonly _ref = inject(DialogRef);

  protected readonly all = computed(() => this.data.isrcs.join('\n'));

  protected close(): void {
    this._ref.close();
  }

  protected retry(): void {
    this._ref.close();
    this.data.retry?.();
  }
}
