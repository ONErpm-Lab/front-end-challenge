import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { Button } from 'primeng/button';

/** What the page shows when the Spotify integration is down: an alert with a button to try again. */
@Component({
  selector: 'orp-unavailable-panel',
  imports: [Button, TranslocoPipe],
  templateUrl: './unavailable-panel.html',
  styleUrl: './unavailable-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnavailablePanel {
  public readonly retry = output<void>();
}
