import { TestBed } from '@angular/core/testing';
import { forgetLanguage, saveLanguage, savedLanguage } from '../../../../testing/saved-language';
import { Language } from '../i18n.enums';
import { LanguageStorageService } from './language-storage.service';

describe('LanguageStorage', () => {
  let storage: LanguageStorageService;

  beforeEach(() => {
    storage = TestBed.inject(LanguageStorageService);
  });

  it('has nothing saved for a first visit', () => {
    // Specs share one jsdom: a language switch still settling from another file may have saved one meanwhile.
    forgetLanguage();

    expect(storage.read()).toBeNull();
  });

  it('reads back the language that was written', () => {
    storage.write(Language.TR);

    expect(storage.read()).toBe(Language.TR);
    expect(savedLanguage()).toBe('tr');
  });

  it('ignores a value that is not a supported language', () => {
    saveLanguage('klingon');

    expect(storage.read()).toBeNull();
  });

  it('accepts a regional tag by its language', () => {
    saveLanguage('pt-PT');

    expect(storage.read()).toBe(Language.PT);
  });

  it('keeps working when the storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(() => storage.write(Language.ES)).not.toThrow();
    expect(storage.read()).toBeNull();
    vi.restoreAllMocks();
    forgetLanguage();
  });
});
