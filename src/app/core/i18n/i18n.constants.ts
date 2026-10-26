import { Language } from './i18n.enums';
import { LanguageOption, TranslationModule } from './i18n.interfaces';

export const DEFAULT_LANGUAGE = Language.EN;

/** HTTP quality value (RFC 9110): `0` to `1`, with at most three decimals (`1` allows only zeros). */
export const QUALITY_VALUE_PATTERN = /^(?:0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/;

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

/** Cookie holding the visitor's explicit choice (a cookie, so the server reads it too: see `LanguageStorage`). */
export const LANGUAGE_COOKIE_NAME = 'orp.language';
export const LANGUAGE_COOKIE_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;

/** One lazy chunk per language: only the language in use is downloaded. */
export const TRANSLATION_IMPORTS: Readonly<Record<Language, () => Promise<TranslationModule>>> = {
  [Language.EN]: () => import('./translations/en.json'),
  [Language.PT]: () => import('./translations/pt.json'),
  [Language.ES]: () => import('./translations/es.json'),
  [Language.RU]: () => import('./translations/ru.json'),
  [Language.FR]: () => import('./translations/fr.json'),
  [Language.TR]: () => import('./translations/tr.json'),
};
