import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { ThemeService } from '../../core/theme/theme.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

/** Switches between the light and the dark theme; its name says what it will do. */
@Component({
  selector: 'orp-theme-toggle',
  imports: [TranslocoPipe, IconComponent],
  templateUrl: './theme-toggle.component.html',
  styleUrl: './theme-toggle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeToggleComponent {
  protected readonly theme = inject(ThemeService);
}
