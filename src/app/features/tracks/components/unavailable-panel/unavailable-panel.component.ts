import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

/** Shown instead of the catalog when Spotify cannot be reached at all, with a way to try again. */
@Component({
  selector: 'orp-unavailable-panel',
  imports: [TranslocoPipe, IconComponent],
  templateUrl: './unavailable-panel.component.html',
  styleUrl: './unavailable-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnavailablePanelComponent {
  public readonly retry = output<void>();
}
