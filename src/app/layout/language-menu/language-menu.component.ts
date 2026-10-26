import { CdkMenu, CdkMenuItemRadio, CdkMenuTrigger } from '@angular/cdk/menu';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { I18nService } from '../../core/i18n/i18n.service';
import { Language } from '../../core/i18n/i18n.enums';
import { IconComponent } from '../../shared/components/icon/icon.component';

/**
 * The language picker: a CDK menu of radio items (arrow keys, Escape and focus return come with it). Each
 * language is written in its own language and marked with its `lang`, so a screen reader pronounces it right.
 */
@Component({
  selector: 'orp-language-menu',
  imports: [TranslocoPipe, IconComponent, CdkMenuTrigger, CdkMenu, CdkMenuItemRadio],
  templateUrl: './language-menu.component.html',
  styleUrl: './language-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageMenuComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly current = computed(
    () =>
      this.i18n.options.find((option) => option.id === this.i18n.language()) ??
      this.i18n.options[0],
  );

  protected choose(language: Language): void {
    // A language that fails to load keeps the current one; nothing else to do here.
    this.i18n.setLanguage(language).catch(() => undefined);
  }
}
