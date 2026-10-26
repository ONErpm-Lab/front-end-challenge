import { detectLanguage, toSupportedLanguage } from './detect-language';
import { Language } from '../i18n.enums';

describe('toSupportedLanguage', () => {
  it.each([
    ['en', Language.EN],
    ['pt', Language.PT],
    ['es', Language.ES],
    ['ru', Language.RU],
    ['fr', Language.FR],
    ['tr', Language.TR],
  ])('accepts %s', (tag, expected) => {
    expect(toSupportedLanguage(tag)).toBe(expected);
  });

  it.each([
    ['pt-BR', Language.PT],
    ['pt-PT', Language.PT],
    ['es-419', Language.ES],
    ['ru-RU', Language.RU],
    ['fr-CA', Language.FR],
    ['tr_TR', Language.TR],
    ['EN-us', Language.EN],
    [' TR ', Language.TR],
  ])('matches the regional variant %s by its primary subtag', (tag, expected) => {
    expect(toSupportedLanguage(tag)).toBe(expected);
  });

  it.each([['de'], ['ja-JP'], ['zh-Hans'], ['xx'], [''], ['  '], ['-'], [null], [undefined]])(
    'rejects %s',
    (tag) => {
      expect(toSupportedLanguage(tag)).toBeNull();
    },
  );

  it('does not match a language by a longer prefix ("english" is not "en")', () => {
    expect(toSupportedLanguage('english')).toBeNull();
  });
});

describe('detectLanguage', () => {
  it('uses the first candidate that is supported, in priority order', () => {
    expect(detectLanguage([Language.RU, 'fr-FR', 'tr'])).toBe(Language.RU);
  });

  it('skips unsupported and empty candidates', () => {
    expect(detectLanguage([null, undefined, 'de-DE', 'ja', 'es-MX', 'fr'])).toBe(Language.ES);
  });

  it('falls back to English when nothing matches', () => {
    expect(detectLanguage(['de', 'ja'])).toBe(Language.EN);
  });

  it('falls back to English with no candidates', () => {
    expect(detectLanguage([])).toBe(Language.EN);
  });
});
