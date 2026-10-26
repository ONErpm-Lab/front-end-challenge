import { ChangeDetectionStrategy, Component, input, linkedSignal } from '@angular/core';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

/**
 * The album cover, or a neutral placeholder when there is none or it fails to load (the placeholder is named
 * by `missingLabel` so the visitor knows the cover is missing, not still loading).
 */
@Component({
  selector: 'orp-track-cover',
  imports: [IconComponent],
  templateUrl: './track-cover.component.html',
  styleUrl: './track-cover.component.scss',
  host: { '[style.--cover-size]': 'fluid() ? null : size() + "px"', '[class.fluid]': 'fluid()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrackCoverComponent {
  public readonly url = input<string | null>(null);
  public readonly alt = input.required<string>();
  public readonly missingLabel = input.required<string>();
  /** Side in pixels (also the intrinsic size given to the image). */
  public readonly size = input(40);
  /** Fills the width of its container (square), for the large cover of the detail panel. */
  public readonly fluid = input(false);
  public readonly eager = input(false);
  public readonly iconSize = input(18);

  /** Goes back to "not broken" whenever the address changes. */
  protected readonly broken = linkedSignal({ source: this.url, computation: () => false });
}
