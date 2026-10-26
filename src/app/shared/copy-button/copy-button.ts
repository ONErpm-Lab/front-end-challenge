import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';

/** How long the button shows that it has copied, before it goes back to offering "copy". */
export const COPY_FEEDBACK_MS = 1500;

/**
 * Copies a text to the clipboard. Icon only by default (`label` names it for assistive technology and as a
 * tooltip), or with a visible `caption`. For a moment after copying it shows a check mark and `copiedLabel`,
 * which is also announced to screen readers.
 */
@Component({
  selector: 'orp-copy-button',
  templateUrl: './copy-button.html',
  styleUrl: './copy-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CopyButton {
  public readonly value = input.required<string>();
  public readonly label = input.required<string>();
  public readonly copiedLabel = input.required<string>();
  /** A visible text for the button; without it the button is only an icon. */
  public readonly caption = input<string>();

  /** Emits after the text reached the clipboard. */
  public readonly copied = output<void>();

  private readonly _clipboard = inject(Clipboard);
  private readonly _done = signal(false);
  private _timer: ReturnType<typeof setTimeout> | null = null;

  protected readonly done = this._done.asReadonly();

  constructor() {
    inject(DestroyRef).onDestroy(() => this._clearTimer());
  }

  protected copy(): void {
    if (!this._clipboard.copy(this.value())) {
      return;
    }
    this._done.set(true);
    this.copied.emit();
    this._clearTimer();
    this._timer = setTimeout(() => this._done.set(false), COPY_FEEDBACK_MS);
  }

  private _clearTimer(): void {
    if (this._timer !== null) {
      clearTimeout(this._timer);
      this._timer = null;
    }
  }
}
