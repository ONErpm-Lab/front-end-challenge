import { Translation } from '@jsverse/transloco';
import { LANGUAGE_OPTIONS, SUPPORTED_LANGUAGES, TRANSLATION_IMPORTS } from '../i18n.constants';
import { Language } from '../i18n.enums';
import en from './en.json';
import es from './es.json';
import fr from './fr.json';
import pt from './pt.json';
import ru from './ru.json';
import tr from './tr.json';

const FILES: Record<Language, Translation> = {
  [Language.EN]: en,
  [Language.PT]: pt,
  [Language.ES]: es,
  [Language.RU]: ru,
  [Language.FR]: fr,
  [Language.TR]: tr,
};

/** `{ a: { b: 'x' } }` → `{ 'a.b': 'x' }` */
function flatten(node: Translation, prefix = ''): Record<string, string> {
  return Object.entries(node).reduce<Record<string, string>>((flat, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === 'string'
      ? { ...flat, [path]: value }
      : { ...flat, ...flatten(value as Translation, path) };
  }, {});
}

const placeholders = (text: string): string[] =>
  [...text.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((match) => match[1]).sort();

const reference = flatten(en);
const others = SUPPORTED_LANGUAGES.filter((language) => language !== Language.EN);

describe('translations', () => {
  it('cover exactly the six required languages', () => {
    expect([...SUPPORTED_LANGUAGES].sort()).toEqual(['en', 'es', 'fr', 'pt', 'ru', 'tr']);
  });

  it('have a file, a lazy import and a selector option for every language', () => {
    expect(Object.keys(FILES).sort()).toEqual([...SUPPORTED_LANGUAGES].sort());
    expect(Object.keys(TRANSLATION_IMPORTS).sort()).toEqual([...SUPPORTED_LANGUAGES].sort());
    expect(LANGUAGE_OPTIONS.map((option) => option.id).sort()).toEqual(
      [...SUPPORTED_LANGUAGES].sort(),
    );
  });

  it('the reference language is not empty', () => {
    expect(Object.keys(reference).length).toBeGreaterThan(10);
  });

  describe.each(others)('%s', (language) => {
    const flat = flatten(FILES[language]);

    it('has exactly the same keys as English: none missing, none left over', () => {
      expect(Object.keys(flat).sort()).toEqual(Object.keys(reference).sort());
    });

    it('has no empty or padded values', () => {
      for (const [key, value] of Object.entries(flat)) {
        expect(value.trim(), key).not.toBe('');
        expect(value, key).toBe(value.trim());
      }
    });

    it('keeps the same interpolation placeholders as English in every key', () => {
      for (const [key, value] of Object.entries(flat)) {
        expect(placeholders(value), key).toEqual(placeholders(reference[key]));
      }
    });
  });

  it('English has no empty or padded values either', () => {
    for (const [key, value] of Object.entries(reference)) {
      expect(value.trim(), key).not.toBe('');
      expect(value, key).toBe(value.trim());
    }
  });

  it('actually translates: no other language is a copy of the English file', () => {
    for (const language of others) {
      expect(flatten(FILES[language]), language).not.toEqual(reference);
    }
  });

  it('every language name in the selector is written in its own language', () => {
    expect(LANGUAGE_OPTIONS.map((option) => option.label)).toEqual([
      'English',
      'Português',
      'Español',
      'Русский',
      'Français',
      'Türkçe',
    ]);
  });
});
