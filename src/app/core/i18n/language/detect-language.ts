import { DEFAULT_LANGUAGE, QUALITY_VALUE_PATTERN, SUPPORTED_LANGUAGES } from '../i18n.constants';
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

/**
 * Language tags of an `Accept-Language` header, most preferred first (`q` weights, ties keep the
 * header order). Dropped: `q=0` ("not acceptable"), a malformed weight, and the `*` wildcard.
 */
export function parseAcceptLanguage(header: string | null | undefined): string[] {
  if (!header) {
    return [];
  }

  return header
    .split(',')
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(';');
      return { tag: tag.trim(), q: weightOf(params), index };
    })
    .filter(({ tag, q }) => tag !== '' && tag !== '*' && q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index)
    .map(({ tag }) => tag);
}

/** The `q` parameter as a number: 1 when absent, `NaN` when it is not a valid quality value. */
function weightOf(params: readonly string[]): number {
  const raw = params
    .map((param) => /^\s*q\s*=\s*(.*?)\s*$/i.exec(param)?.[1])
    .find((value) => value !== undefined);
  if (raw === undefined) {
    return 1;
  }
  return QUALITY_VALUE_PATTERN.test(raw) ? Number(raw) : Number.NaN;
}
