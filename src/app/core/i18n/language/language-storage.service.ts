import { Injectable, inject } from '@angular/core';
import { SafeStorageService } from '../../storage/safe-storage.service';
import { LANGUAGE_STORAGE_KEY } from '../i18n.constants';
import { Language } from '../i18n.enums';
import { toSupportedLanguage } from './detect-language';

/**
 * The language the visitor chose, kept in `localStorage` for the next visit. A value that is not a supported
 * language is ignored; a storage that fails only means the choice lasts this visit.
 */
@Injectable({ providedIn: 'root' })
export class LanguageStorageService {
  private readonly _storage = inject(SafeStorageService);

  public read(): Language | null {
    return toSupportedLanguage(this._storage.read(LANGUAGE_STORAGE_KEY));
  }

  public write(language: Language): void {
    this._storage.write(LANGUAGE_STORAGE_KEY, language);
  }
}
