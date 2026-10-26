import { Injectable } from '@angular/core';
import { TranslocoLoader, Translation } from '@jsverse/transloco';
import { Observable, from, map } from 'rxjs';
import { TRANSLATION_IMPORTS } from '../i18n.constants';
import { toSupportedLanguage } from '../language/detect-language';

/**
 * Loads translations from lazy chunks instead of HTTP: nothing to fetch on the server render,
 * no extra round trip in the browser, and the build fails if a language file goes missing.
 */
@Injectable({ providedIn: 'root' })
export class TranslationLoaderService implements TranslocoLoader {
  public getTranslation(lang: string): Observable<Translation> {
    const language = toSupportedLanguage(lang);
    if (!language) {
      throw new Error(`Unsupported language "${lang}".`);
    }
    return from(TRANSLATION_IMPORTS[language]()).pipe(map((module) => module.default));
  }
}
