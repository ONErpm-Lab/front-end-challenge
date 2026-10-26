import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { Button } from 'primeng/button';
import { Theme } from '../../core/theme/theme';

/** Light/dark switch. The label names the action it will perform, which is what assistive tech needs. */
@Component({
  selector: 'orp-theme-toggle',
  imports: [Button, TranslocoPipe],
  template: `
    <p-button
      severity="secondary"
      [rounded]="true"
      [text]="true"
      [buttonProps]="{ autofocus: false }"
      [icon]="icon()"
      [ariaLabel]="(theme.isDark() ? 'app.theme.toLight' : 'app.theme.toDark') | transloco"
      (onClick)="theme.toggle()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeToggle {
  protected readonly theme = inject(Theme);
  /** The icon shows the theme you would switch to. */
  protected readonly icon = computed(() => (this.theme.isDark() ? 'pi pi-sun' : 'pi pi-moon'));
}
