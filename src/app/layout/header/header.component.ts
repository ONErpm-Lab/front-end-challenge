import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { LanguageMenuComponent } from '../language-menu/language-menu.component';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';

/** The top bar: product mark, where the visitor is, language and theme. */
@Component({
  selector: 'orp-header',
  imports: [TranslocoPipe, IconComponent, LanguageMenuComponent, ThemeToggleComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {}
