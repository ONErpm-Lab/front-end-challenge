import { LookupStatus } from '../../../../contract/tracks.enums';
import { sortResults } from './sort-results';
import { TITLE_SORT_LOCALE } from './domain.constants';
import { SortDirection } from './domain.enums';
import { errorResult, foundResult, notFoundResult, titles } from '../testing/builders';

describe('sortResults', () => {
  describe('descending (Z to A)', () => {
    it('orders found tracks from Z to A, with the same collation (accents, case, punctuation)', () => {
      const sorted = sortResults(
        [
          foundResult('Érica'),
          foundResult('...Zebra'),
          foundResult('dani'),
          foundResult('Eduardo'),
        ],
        TITLE_SORT_LOCALE,
        SortDirection.DESC,
      );

      expect(titles(sorted)).toEqual(['...Zebra', 'Érica', 'Eduardo', 'dani']);
    });

    it('keeps the ISRCs without a track after the tracks, in the same order as ascending', () => {
      const input = [
        errorResult('BR1SP1200071'),
        foundResult('Louca'),
        notFoundResult('XX1AA0000002'),
        foundResult('Quase Nua'),
        notFoundResult('XX1AA0000001'),
      ];

      const descending = sortResults(input, TITLE_SORT_LOCALE, SortDirection.DESC);

      expect(titles(descending).slice(0, 2)).toEqual(['Quase Nua', 'Louca']);
      expect(descending.slice(2).map((result) => result.isrc)).toEqual(
        sortResults(input)
          .slice(2)
          .map((result) => result.isrc),
      );
    });

    it('keeps equal titles in their input order, as ascending does', () => {
      const first = foundResult('Same', { id: 'first' });
      const second = foundResult('Same', { id: 'second' });

      const sorted = sortResults([first, second], TITLE_SORT_LOCALE, SortDirection.DESC);

      expect(sorted).toEqual([first, second]);
    });

    it('is the exact reverse of ascending when every title is different', () => {
      const input = ['Dani', 'Érica', 'Louca', 'Quase Nua', 'Zebra'].map((title) =>
        foundResult(title),
      );

      const ascending = titles(sortResults(input));
      const descending = titles(sortResults(input, TITLE_SORT_LOCALE, SortDirection.DESC));

      expect(descending).toEqual([...ascending].reverse());
    });
  });

  it('orders found tracks alphabetically by title', () => {
    const sorted = sortResults([
      foundResult('Quase Nua'),
      foundResult('Louca'),
      foundResult('Repente'),
    ]);

    expect(titles(sorted)).toEqual(['Louca', 'Quase Nua', 'Repente']);
  });

  it('ignores case', () => {
    const sorted = sortResults([
      foundResult('banana'),
      foundResult('Apple'),
      foundResult('cherry'),
    ]);

    expect(titles(sorted)).toEqual(['Apple', 'banana', 'cherry']);
  });

  it('ignores accents, so É files under E', () => {
    const sorted = sortResults([
      foundResult('Zebra'),
      foundResult('Érica'),
      foundResult('Eduardo'),
      foundResult('Dani'),
    ]);

    expect(titles(sorted)).toEqual(['Dani', 'Eduardo', 'Érica', 'Zebra']);
  });

  it('ignores leading punctuation: "...É pra Você" is not sorted before "A"', () => {
    const sorted = sortResults([
      foundResult('Quem Diria'),
      foundResult('...É pra Você'),
      foundResult('Louca'),
    ]);

    expect(titles(sorted)).toEqual(['...É pra Você', 'Louca', 'Quem Diria']);
  });

  it('compares numbers by value', () => {
    const sorted = sortResults([
      foundResult('Track 10'),
      foundResult('Track 2'),
      foundResult('Track 1'),
    ]);

    expect(titles(sorted)).toEqual(['Track 1', 'Track 2', 'Track 10']);
  });

  it('puts Latin titles before Cyrillic ones, and sorts Cyrillic among themselves', () => {
    const sorted = sortResults([
      foundResult('Нам не нравится'),
      foundResult('Repente'),
      foundResult('Доверюсь солнцу'),
      foundResult('IRON MAIDEN'),
    ]);

    expect(titles(sorted)).toEqual([
      'IRON MAIDEN',
      'Repente',
      'Доверюсь солнцу',
      'Нам не нравится',
    ]);
  });

  it('keeps the input order of tracks with the same title', () => {
    const first = foundResult('Louca', { id: 'first' });
    const second = foundResult('Louca', { id: 'second' });

    expect(sortResults([first, second])).toEqual([first, second]);
    expect(sortResults([second, first])).toEqual([second, first]);
  });

  it('is independent of the order it receives', () => {
    const results = ['d', 'a', 'c', 'b'].map((title) => foundResult(title));

    expect(titles(sortResults(results))).toEqual(titles(sortResults([...results].reverse())));
  });

  describe('results without a title', () => {
    it('places not-found and failed ISRCs after the tracks, not-found first, each ordered by ISRC', () => {
      const sorted = sortResults([
        errorResult('ZZ1AA0000002'),
        notFoundResult('BR1SP1200071'),
        foundResult('Zebra'),
        errorResult('AA1AA0000001'),
        notFoundResult('AA1AA0000009'),
        foundResult('Apple'),
      ]);

      expect(sorted.map((result) => [result.status, result.isrc])).toEqual([
        [LookupStatus.FOUND, 'BR1SP1200071'],
        [LookupStatus.FOUND, 'BR1SP1200071'],
        [LookupStatus.NOT_FOUND, 'AA1AA0000009'],
        [LookupStatus.NOT_FOUND, 'BR1SP1200071'],
        [LookupStatus.ERROR, 'AA1AA0000001'],
        [LookupStatus.ERROR, 'ZZ1AA0000002'],
      ]);
      expect(titles(sorted).slice(0, 2)).toEqual(['Apple', 'Zebra']);
    });
  });

  it('returns a new array and leaves the input untouched', () => {
    const input = [foundResult('b'), foundResult('a')];
    const snapshot = [...input];

    const sorted = sortResults(input);

    expect(sorted).not.toBe(input);
    expect(input).toEqual(snapshot);
  });

  it('handles an empty list', () => {
    expect(sortResults([])).toEqual([]);
  });

  describe('collation locale', () => {
    afterEach(() => vi.restoreAllMocks());

    it('is a locale the runtime really supports, so Intl never falls back to its default', () => {
      expect(new Intl.Collator(TITLE_SORT_LOCALE).resolvedOptions().locale).toBe(TITLE_SORT_LOCALE);
    });

    it('sorts with that fixed locale unless another one is requested', () => {
      const RealCollator = Intl.Collator;
      const collator = vi.spyOn(Intl, 'Collator').mockImplementation(function (locales, options) {
        return new RealCollator(locales, options);
      } as typeof Intl.Collator);

      sortResults([foundResult('b'), foundResult('a')]);

      expect(collator).toHaveBeenCalledWith(TITLE_SORT_LOCALE, expect.any(Object));
    });

    /**
     * Intl falls back to the runtime default locale when a tag is not supported (e.g. `und`).
     * Emulates servers/browsers whose default is Russian, Swedish, ...: the order must not move.
     */
    it.each(['ru', 'sv', 'tr', 'pt-BR'])(
      'gives the same order when the runtime default locale is %s',
      (runtimeDefault) => {
        const RealCollator = Intl.Collator;
        vi.spyOn(Intl, 'Collator').mockImplementation(function (locales, options) {
          const supported =
            locales !== undefined && RealCollator.supportedLocalesOf(locales).length > 0;
          return new RealCollator(supported ? locales : runtimeDefault, options);
        } as typeof Intl.Collator);

        const sorted = sortResults([
          foundResult('Zebra'),
          foundResult('Ä'),
          foundResult('Нам не нравится'),
          foundResult('Repente'),
        ]);

        expect(titles(sorted)).toEqual(['Ä', 'Repente', 'Zebra', 'Нам не нравится']);
      },
    );
  });

  it('accepts another locale, e.g. to follow a language-specific alphabet', () => {
    const sorted = sortResults([foundResult('Z'), foundResult('Ä')], 'sv');

    expect(titles(sorted)).toEqual(['Z', 'Ä']);
  });
});
