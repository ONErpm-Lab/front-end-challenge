import { DOCUMENT, isPlatformServer } from '@angular/common';
import { PLATFORM_ID, REQUEST, Injectable, computed, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TranslocoService } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';
import { detectLanguage, parseAcceptLanguage } from './language/detect-language';
import { DEFAULT_LANGUAGE, LANGUAGE_OPTIONS } from './i18n.constants';
import { Language } from './i18n.enums';
import { LanguageStorage } from './language/language-storage';

/** The visitor's language: picks it, loads its translations, and keeps `<html lang>` in sync. */
@Injectable({ providedIn: 'root' })
export class I18n {
  private readonly _transloco = inject(TranslocoService);
  private readonly _storage = inject(LanguageStorage);
  private readonly _document = inject(DOCUMENT);
  private readonly _title = inject(Title);
  private readonly _isServer = isPlatformServer(inject(PLATFORM_ID));
  /** Only present while rendering on the server. */
  private readonly _request = inject(REQUEST, { optional: true });
  private readonly _language = signal(DEFAULT_LANGUAGE);
  /** Identifier of the newest language request; older ones must not commit. */
  private _latestRequest = 0;

  public readonly options = LANGUAGE_OPTIONS;
  public readonly language = this._language.asReadonly();

  /** BCP 47 tag of the current language, for `Intl` (dates, numbers). */
  public readonly locale = computed(() => this._localeOf(this._language()));

  /**
   * Applies the language to start with. Never rejects: a broken language file falls back to the
   * default language, and if even that fails the page still renders (with raw keys).
   */
  public async init(): Promise<void> {
    const detected = detectLanguage(this._candidates());
    for (const language of new Set([detected, DEFAULT_LANGUAGE])) {
      try {
        await this._apply(language);
        return;
      } catch {
        // Try the next one.
      }
    }
  }

  /**
   * Switches language and remembers the choice. Rejects (keeping the current language) if it cannot
   * load. Only the latest selection takes effect: if the visitor picks another language while this
   * one is still loading, this call resolves without applying or saving anything.
   */
  public async setLanguage(language: Language): Promise<void> {
    if (await this._apply(language)) {
      this._storage.write(language);
    }
  }

  /**
   * The same order on both sides: the saved choice (a cookie, which the server receives too), then the preferences
   * of the browser (`navigator.languages`; on the server, the request's `Accept-Language`).
   */
  private _candidates(): (string | null | undefined)[] {
    const preferred = this._isServer
      ? parseAcceptLanguage(this._request?.headers.get('accept-language'))
      : (this._document.defaultView?.navigator.languages ?? []);
    return [this._storage.read(), ...preferred];
  }

  /**
   * Loads and activates a language, unless a newer request superseded it while it was loading
   * (lazy chunks finish in any order). Returns whether this request was the one applied.
   */
  private async _apply(language: Language): Promise<boolean> {
    const request = ++this._latestRequest;
    try {
      await firstValueFrom(this._transloco.load(language));
    } catch (error) {
      if (request !== this._latestRequest) {
        return false; // Nobody is waiting for this language any more: its failure is irrelevant.
      }
      throw error;
    }
    if (request !== this._latestRequest) {
      return false;
    }

    this._transloco.setActiveLang(language);
    this._language.set(language);
    this._document.documentElement.lang = this._localeOf(language);
    // The tab carries the product name ("Consulta de ISRC"), not the page heading.
    this._title.setTitle(this._transloco.translate('app.eyebrow'));
    return true;
  }

  private _localeOf(language: Language): string {
    return LANGUAGE_OPTIONS.find((option) => option.id === language)?.locale ?? language;
  }
}
