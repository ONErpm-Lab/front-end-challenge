import { ChangeDetectionStrategy, Component, computed, input, model, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { CopyButton } from '../../../../shared/copy-button/copy-button';

/**
 * A modal list of ISRCs, each one copyable, with a button that copies them all (one per line). The page uses it
 * for the ISRCs that are not in the database and for the ones whose lookup failed (which can be tried again).
 */
@Component({
  selector: 'orp-isrc-list-dialog',
  imports: [Button, CopyButton, Dialog, TranslocoPipe],
  templateUrl: './isrc-list-dialog.html',
  styleUrl: './isrc-list-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IsrcListDialog {
  public readonly isrcs = input.required<readonly string[]>();
  public readonly title = input.required<string>();
  public readonly hint = input.required<string>();
  /** The accessible name of the list. */
  public readonly listLabel = input.required<string>();
  /** Offers "try again" next to "copy all". */
  public readonly retryable = input(false);

  /** Whether the dialog is open (two-way). */
  public readonly visible = model(false);

  public readonly retry = output<void>();
  /** The dialog has closed, by any means: the page uses it to give the focus back. */
  public readonly closed = output<void>();

  /** All the ISRCs, one per line: what "copy all" puts on the clipboard. */
  protected readonly allText = computed(() => this.isrcs().join('\n'));
}
