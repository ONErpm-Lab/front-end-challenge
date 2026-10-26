import { LANGUAGE_STORAGE_KEY } from '../app/core/i18n/i18n.constants';

/** The visitor's saved language lives in `localStorage`: these let a test plant it, read it back, and clear it. */
export function saveLanguage(value: string): void {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, value);
}

export function savedLanguage(): string | null {
  return localStorage.getItem(LANGUAGE_STORAGE_KEY);
}

export function forgetLanguage(): void {
  localStorage.removeItem(LANGUAGE_STORAGE_KEY);
}
