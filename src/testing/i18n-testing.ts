import { TestBed } from '@angular/core/testing';
import { I18nService } from '../app/core/i18n/i18n.service';
import { Language } from '../app/core/i18n/i18n.enums';
import { provideTranslation } from '../app/core/i18n/provide-i18n';

/** Real Transloco with the real translation files, for component tests. */
export const i18nTestProviders = [provideTranslation()];

/** Loads and activates a language so the `transloco` pipe resolves to real text. */
export async function useLanguage(language: Language = Language.EN): Promise<void> {
  await TestBed.inject(I18nService).setLanguage(language);
}
