import { Language } from './i18n.enums';
import { LanguageOption, TranslationModule } from './i18n.interfaces';

export const DEFAULT_LANGUAGE = Language.EN;

/** Display order of the language selector. */
export const LANGUAGE_OPTIONS: readonly LanguageOption[] = [
  { id: Language.EN, label: 'English', locale: 'en' },
  { id: Language.PT, label: 'Português', locale: 'pt-BR' },
  { id: Language.ES, label: 'Español', locale: 'es' },
  { id: Language.RU, label: 'Русский', locale: 'ru' },
  { id: Language.FR, label: 'Français', locale: 'fr' },
  { id: Language.TR, label: 'Türkçe', locale: 'tr' },
];

export const SUPPORTED_LANGUAGES: readonly Language[] = LANGUAGE_OPTIONS.map((option) => option.id);

/** `localStorage` key of the visitor's explicit choice (see `LanguageStorage`). */
export const LANGUAGE_STORAGE_KEY = 'orp.language';

/** One lazy chunk per language: only the language in use is downloaded. */
export const TRANSLATION_IMPORTS: Readonly<Record<Language, () => Promise<TranslationModule>>> = {
  [Language.EN]: () => import('./translations/en.json'),
  [Language.PT]: () => import('./translations/pt.json'),
  [Language.ES]: () => import('./translations/es.json'),
  [Language.RU]: () => import('./translations/ru.json'),
  [Language.FR]: () => import('./translations/fr.json'),
  [Language.TR]: () => import('./translations/tr.json'),
};
