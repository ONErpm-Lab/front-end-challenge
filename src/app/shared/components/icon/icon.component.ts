import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ICON_PATHS } from './icon.constants';
import { IconName } from './icon.types';

/**
 * A stroke icon drawn inline (no icon font, no request): it takes the text color and is always decorative,
 * so the control that holds it carries the accessible name.
 */
@Component({
  selector: 'orp-icon',
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconComponent {
  public readonly name = input.required<IconName>();
  public readonly size = input(16);
  public readonly strokeWidth = input(2);

  protected readonly paths = computed(() => ICON_PATHS[this.name()]);
}
