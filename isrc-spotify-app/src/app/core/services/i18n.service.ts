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

  // Signals para gerenciar estado
  private _currentLanguage = signal<SupportedLanguage>(this.getStoredLanguage());
  private _translations = signal<Translation>({});
  private _isLoading = signal<boolean>(false);

  // Computed signals públicos
  public readonly currentLanguage = this._currentLanguage.asReadonly();
  public readonly translations = this._translations.asReadonly();
  public readonly isLoading = this._isLoading.asReadonly();

  // Cache para traduções
  private translationCache = new Map<SupportedLanguage, Translation>();

  constructor(private http: HttpClient) {
    // Carregar traduções iniciais
    this.loadTranslations(this._currentLanguage()).subscribe();
  }

  /**
   * Obtém idioma armazenado ou retorna padrão
   */
  private getStoredLanguage(): SupportedLanguage {
    const stored = localStorage.getItem(this.STORAGE_KEY) as SupportedLanguage;
    return this.isValidLanguage(stored) ? stored : this.DEFAULT_LANGUAGE;
  }

  /**
   * Verifica se o idioma é válido
   */
  private isValidLanguage(lang: string): lang is SupportedLanguage {
    return ['pt', 'en', 'es'].includes(lang);
  }

  /**
   * Carrega traduções para um idioma específico
   */
  private loadTranslations(language: SupportedLanguage): Observable<Translation> {
    // Verificar cache primeiro
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
        // Armazenar no cache
        this.translationCache.set(language, translations);
        this._translations.set(translations);
        this._isLoading.set(false);
        return translations;
      }),
      shareReplay(1)
    );
  }

  /**
   * Altera o idioma atual
   */
  changeLanguage(language: SupportedLanguage): Observable<Translation> {
    if (!this.isValidLanguage(language)) {
      throw new Error(`Idioma não suportado: ${language}`);
    }

    // Atualizar estado
    this._currentLanguage.set(language);

    // Salvar no localStorage
    localStorage.setItem(this.STORAGE_KEY, language);

    // Carregar traduções
    return this.loadTranslations(language);
  }

  /**
   * Obtém uma tradução por chave
   */
  translate(key: string, params?: { [key: string]: any }): string {
    const translations = this._translations();

    // Se ainda não há traduções carregadas, retornar a chave
    if (!translations || Object.keys(translations).length === 0) {
      return key;
    }

    const value = this.getNestedValue(translations, key);

    if (value === undefined || value === null) {
      console.warn(`Tradução não encontrada para a chave: ${key}`);
      return key;
    }

    return this.interpolate(value.toString(), params);
  }

  /**
   * Obtém uma tradução por chave (versão reativa)
   */
  translate$(key: string, params?: { [key: string]: any }): Observable<string> {
    return new Observable((subscriber) => {
      const value = this.translate(key, params);
      subscriber.next(value);

      // Observar mudanças no idioma atual
      const unsubscribe = () => {};
      return unsubscribe;
    });
  }

  /**
   * Obtém valor aninhado de um objeto usando notação de ponto
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Interpola parâmetros na string de tradução
   */
  private interpolate(text: string, params?: { [key: string]: any }): string {
    if (!params) return text;

    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return params[key] !== undefined ? params[key].toString() : match;
    });
  }

  /**
   * Obtém todas as linguagens suportadas
   */
  getSupportedLanguages(): SupportedLanguage[] {
    return ['pt', 'en', 'es'];
  }

  /**
   * Obtém informações de uma linguagem
   */
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

  /**
   * Pipe helper para templates
   */
  instant(key: string, params?: { [key: string]: any }): string {
    return this.translate(key, params);
  }
}
