import { Translation } from '@jsverse/transloco';
import { Language } from './i18n.enums';

export interface LanguageOption {
  readonly id: Language;
  /** Name in its own language, so a visitor can find it whatever the current language is. */
  readonly label: string;
  /** BCP 47 tag for `<html lang>` and `Intl` (dates, collation), e.g. `pt-BR`. */
  readonly locale: string;
}

/** What a lazy `import('./translations/xx.json')` resolves to. */
export interface TranslationModule {
  readonly default: Translation;
}
