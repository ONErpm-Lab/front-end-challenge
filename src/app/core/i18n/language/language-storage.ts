import { DOCUMENT, isPlatformServer } from '@angular/common';
import { Injectable, PLATFORM_ID, REQUEST, inject } from '@angular/core';
import { toSupportedLanguage } from './detect-language';
import { readCookie, serializeCookie } from './language-cookie';
import { LANGUAGE_COOKIE_MAX_AGE_SECONDS, LANGUAGE_COOKIE_NAME } from '../i18n.constants';
import { Language } from '../i18n.enums';

/**
 * The visitor's saved language, in a cookie: it is the one place both the browser and the server can read, so
 * the server renders the language the visitor chose (not only the one the browser asks for) and the page does
 * not change language after hydration. A value that is not a supported language is ignored.
 */
@Injectable({ providedIn: 'root' })
export class LanguageStorage {
  private readonly _document = inject(DOCUMENT);
  private readonly _isServer = isPlatformServer(inject(PLATFORM_ID));
  /** Only present while rendering on the server. */
  private readonly _request = inject(REQUEST, { optional: true });

  public read(): Language | null {
    return toSupportedLanguage(readCookie(this._cookies(), LANGUAGE_COOKIE_NAME));
  }

  /** Remembers the choice for a year. Never throws: a blocked cookie only means the choice lasts this visit. */
  public write(language: Language): void {
    if (this._isServer) {
      return;
    }
    try {
      this._document.cookie = serializeCookie(LANGUAGE_COOKIE_NAME, language, {
        maxAgeSeconds: LANGUAGE_COOKIE_MAX_AGE_SECONDS,
        secure: this._document.defaultView?.location.protocol === 'https:',
      });
    } catch {
      // Cookies are blocked (sandboxed frame, privacy settings).
    }
  }

  private _cookies(): string | null {
    if (this._isServer) {
      return this._request?.headers.get('cookie') ?? null;
    }
    try {
      return this._document.cookie;
    } catch {
      return null;
    }
  }
}
