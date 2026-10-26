import { LANGUAGE_COOKIE_NAME } from '../core/i18n/i18n.constants';
import { readCookie } from '../core/i18n/language/language-cookie';

/** The visitor's saved language lives in a cookie: these let a test plant it, read it back, and clear it. */
export function saveLanguage(value: string): void {
  document.cookie = `${LANGUAGE_COOKIE_NAME}=${value}; Path=/`;
}

export function savedLanguage(): string | null {
  return readCookie(document.cookie, LANGUAGE_COOKIE_NAME);
}

export function forgetLanguage(): void {
  document.cookie = `${LANGUAGE_COOKIE_NAME}=; Path=/; Max-Age=0`;
}
