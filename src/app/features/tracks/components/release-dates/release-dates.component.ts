import { CdkConnectedOverlay, CdkOverlayOrigin, ConnectedPosition } from '@angular/cdk/overlay';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { ReleaseDate } from '../../../../models/tracks.interfaces';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { formatReleaseDate } from '../../domain/format-release-date';

let nextId = 0;

/**
 * Warns that Spotify has more than one release date for the ISRC ("2 dates found"). The warning is a button: it
 * opens a popover with every date, the one the page shows marked. Escape or a click outside closes it, and the
 * focus goes back to the button. Nothing is shown when there is only one date.
 */
@Component({
  selector: 'orp-release-dates',
  imports: [TranslocoPipe, IconComponent, CdkOverlayOrigin, CdkConnectedOverlay],
  templateUrl: './release-dates.component.html',
  styleUrl: './release-dates.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReleaseDatesComponent {
  /** Every distinct release date, oldest first. */
  public readonly dates = input.required<readonly ReleaseDate[]>();
  /** The date the page shows. */
  public readonly shown = input.required<ReleaseDate>();

  private readonly _i18n = inject(I18nService);
  private readonly _trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');
  private readonly _popover = viewChild<ElementRef<HTMLElement>>('popover');

  protected readonly popoverId = `release-dates-${nextId++}`;
  protected readonly open = signal(false);
  protected readonly positions: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 6 },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -6 },
  ];

  protected readonly rows = computed(() =>
    this.dates().map((date) => ({
      value: date.value,
      label: formatReleaseDate(date, this._i18n.locale()),
      shown: date.value === this.shown().value,
    })),
  );

  protected toggle(): void {
    if (this.open()) {
      this.close();
    } else {
      this.open.set(true);
    }
  }

  /** Puts the focus in the popover once it is on screen, so it is read out. */
  protected onAttach(): void {
    queueMicrotask(() => this._popover()?.nativeElement.focus());
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
    }
  }

  protected onOutsideClick(event: MouseEvent): void {
    // A click on the button itself toggles: let `toggle()` handle it.
    if (!this._trigger()?.nativeElement.contains(event.target as Node)) {
      this.close(false);
    }
  }

  protected close(restoreFocus = true): void {
    if (!this.open()) {
      return;
    }
    this.open.set(false);
    if (restoreFocus) {
      this._trigger()?.nativeElement.focus();
    }
  }
}
