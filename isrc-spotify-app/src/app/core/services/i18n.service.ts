import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

export type SupportedLanguage = 'pt' | 'en' | 'es';

export interface Translation {
  [key: string]: any;
}

@Injectable({
  providedIn: 'root',
})
export class I18nService {
  private readonly STORAGE_KEY = 'app-language';
  private readonly DEFAULT_LANGUAGE: SupportedLanguage = 'pt';

  private _currentLanguage = signal<SupportedLanguage>(this.getStoredLanguage());
  private _translations = signal<Translation>({});
  private _isLoading = signal<boolean>(false);

  public readonly currentLanguage = this._currentLanguage.asReadonly();
  public readonly translations = this._translations.asReadonly();
  public readonly isLoading = this._isLoading.asReadonly();

  private translationCache = new Map<SupportedLanguage, Translation>();

  constructor(private http: HttpClient) {
    this.loadTranslations(this._currentLanguage()).subscribe();
  }

  private getStoredLanguage(): SupportedLanguage {
    const stored = localStorage.getItem(this.STORAGE_KEY) as SupportedLanguage;
    return this.isValidLanguage(stored) ? stored : this.DEFAULT_LANGUAGE;
  }

  private isValidLanguage(lang: string): lang is SupportedLanguage {
    return ['pt', 'en', 'es'].includes(lang);
  }

  private loadTranslations(language: SupportedLanguage): Observable<Translation> {
    const cached = this.translationCache.get(language);
    if (cached) {
      this._translations.set(cached);
      return new Observable((subscriber) => {
        subscriber.next(cached);
        subscriber.complete();
      });
    }

    this._isLoading.set(true);

    return this.http.get<Translation>(`/assets/i18n/${language}.json`).pipe(
      map((translations) => {
        this.translationCache.set(language, translations);
        this._translations.set(translations);
        this._isLoading.set(false);
        return translations;
      }),
      shareReplay(1)
    );
  }

  changeLanguage(language: SupportedLanguage): Observable<Translation> {
    if (!this.isValidLanguage(language)) {
      throw new Error(`Idioma não suportado: ${language}`);
    }

    this._currentLanguage.set(language);

    localStorage.setItem(this.STORAGE_KEY, language);

    return this.loadTranslations(language);
  }

  translate(key: string, params?: { [key: string]: any }): string {
    const translations = this._translations();

    if (!translations || Object.keys(translations).length === 0) {
      return key;
    }

    const value = this.getNestedValue(translations, key);

    if (value === undefined || value === null) {
      return key;
    }

    return this.interpolate(value.toString(), params);
  }

  translate$(key: string, params?: { [key: string]: any }): Observable<string> {
    return new Observable((subscriber) => {
      const value = this.translate(key, params);
      subscriber.next(value);

      const unsubscribe = () => {};
      return unsubscribe;
    });
  }

  private getNestedValue(obj: any, path: string): any {
    if (!path || !obj) return undefined;
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  private interpolate(text: string, params?: { [key: string]: any }): string {
    if (!params) return text;

    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return params[key] !== undefined ? params[key].toString() : match;
    });
  }

  getSupportedLanguages(): SupportedLanguage[] {
    return ['pt', 'en', 'es'];
  }

  getLanguageInfo(language: SupportedLanguage): {
    code: SupportedLanguage;
    name: string;
    flag: string;
  } {
    const languageMap = {
      pt: { code: 'pt' as SupportedLanguage, name: 'Português', flag: '🇧🇷' },
      en: { code: 'en' as SupportedLanguage, name: 'English', flag: '🇺🇸' },
      es: { code: 'es' as SupportedLanguage, name: 'Español', flag: '🇪🇸' },
    };

    return languageMap[language];
  }

  instant(key: string, params?: { [key: string]: any }): string {
    if (!key) return '';
    return this.translate(key, params);
  }
}
