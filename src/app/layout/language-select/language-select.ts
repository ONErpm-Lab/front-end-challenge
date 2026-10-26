import { ChangeDetectionStrategy, Component, inject, viewChild } from '@angular/core';
import { FormsModule, NgModel } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { Select } from 'primeng/select';
import { I18n } from '../../core/i18n/i18n';
import { Language } from '../../core/i18n/i18n.enums';

/** Language picker. Each name is written in its own language and tagged with it for screen readers. */
@Component({
  selector: 'orp-language-select',
  imports: [FormsModule, Select, TranslocoPipe],
  templateUrl: './language-select.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageSelect {
  protected readonly i18n = inject(I18n);
  /** PrimeNG types its options as a mutable array. */
  protected readonly options = [...this.i18n.options];
  private readonly _model = viewChild(NgModel);

  protected select(language: Language): void {
    this.i18n.setLanguage(language).catch(() => {
      // The picker already shows the rejected language while the page kept the old one:
      // put the control back on the language that is really active.
      this._model()?.control.setValue(this.i18n.language());
    });
  }
}
