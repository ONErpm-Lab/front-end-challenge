import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LanguageSelect } from '../language-select/language-select';
import { ThemeToggle } from '../theme-toggle/theme-toggle';

@Component({
  selector: 'orp-app-header',
  imports: [LanguageSelect, ThemeToggle, TranslocoPipe],
  templateUrl: './app-header.html',
  styleUrl: './app-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppHeader {}
