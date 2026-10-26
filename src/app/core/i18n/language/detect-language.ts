import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from '../i18n.constants';
import { Language } from '../i18n.enums';

/**
 * Picks the first candidate (a saved choice, then the browser's preferences, in priority order)
 * that maps to a supported language. Regional variants match by their primary subtag, so
 * `pt-PT`, `ru-RU` or `TR` resolve to `pt`, `ru` and `tr`. Falls back to the default language.
 */
export function detectLanguage(candidates: readonly (string | null | undefined)[]): Language {
  for (const candidate of candidates) {
    const language = toSupportedLanguage(candidate);
    if (language) {
      return language;
    }
  }
  return DEFAULT_LANGUAGE;
}

export function toSupportedLanguage(tag: string | null | undefined): Language | null {
  const primary = tag?.trim().toLowerCase().split(/[-_]/)[0];
  return SUPPORTED_LANGUAGES.find((language) => language === primary) ?? null;
}
