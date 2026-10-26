import { PLATFORM_ID, REQUEST } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { forgetLanguage, saveLanguage, savedLanguage } from '../../../testing/saved-language';
import { LANGUAGE_COOKIE_NAME } from '../i18n.constants';
import { Language } from '../i18n.enums';
import { LanguageStorage } from './language-storage';

function create(platform: 'browser' | 'server' = 'browser', cookie?: string): LanguageStorage {
  TestBed.configureTestingModule({
    providers: [
      { provide: PLATFORM_ID, useValue: platform },
      {
        provide: REQUEST,
        useValue: cookie ? new Request('http://localhost/', { headers: { cookie } }) : null,
      },
    ],
  });
  return TestBed.inject(LanguageStorage);
}

describe('LanguageStorage', () => {
  beforeEach(() => forgetLanguage());

  it('reads nothing when no language was saved', () => {
    expect(create().read()).toBeNull();
  });

  it('reads back what it wrote, in a cookie of its own for the whole site', () => {
    const storage = create();

    storage.write(Language.RU);

    expect(storage.read()).toBe(Language.RU);
    expect(savedLanguage()).toBe('ru');
    expect(document.cookie).toContain(`${LANGUAGE_COOKIE_NAME}=ru`);
  });

  it('overwrites the previous choice', () => {
    const storage = create();
    storage.write(Language.RU);

    storage.write(Language.FR);

    expect(storage.read()).toBe(Language.FR);
  });

  it.each([['de'], ['xx'], ['<script>'], ['']])(
    'ignores a stored value that is not a supported language (%j)',
    (value) => {
      saveLanguage(value);

      expect(create().read()).toBeNull();
    },
  );

  it('normalizes a stored regional tag', () => {
    saveLanguage('pt-BR');

    expect(create().read()).toBe(Language.PT);
  });

  it('does not fail when the browser blocks cookies', () => {
    const storage = create();
    const blocked = () => {
      throw new Error('blocked');
    };
    const getter = vi.spyOn(document, 'cookie', 'get').mockImplementation(blocked);
    const setter = vi.spyOn(document, 'cookie', 'set').mockImplementation(blocked);

    try {
      expect(() => storage.write(Language.RU)).not.toThrow();
      expect(storage.read()).toBeNull();
    } finally {
      getter.mockRestore();
      setter.mockRestore();
    }
  });

  describe('on the server', () => {
    it('reads the cookie of the request, not the page', () => {
      saveLanguage('ru');

      expect(create('server', 'orp.language=fr').read()).toBe(Language.FR);
    });

    it('reads nothing when the request has no such cookie, or there is no request', () => {
      saveLanguage('ru');

      expect(create('server', 'theme=dark').read()).toBeNull();
      TestBed.resetTestingModule();
      expect(create('server').read()).toBeNull();
    });

    it('never writes: the response is not the place', () => {
      create('server').write(Language.RU);

      expect(savedLanguage()).toBeNull();
    });
  });
});
