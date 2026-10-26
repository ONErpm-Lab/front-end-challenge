import { LookupStatus } from '../../../models/tracks.enums';
import { TrackLookupResult } from '../../../models/tracks.types';
import { filterResults } from './filter-results';
import { errorResult, foundResult, notFoundResult } from '../testing/builders';

const LOUCA = foundResult('Louca', { isrc: 'BXKZM1900345' });
const EPRA = foundResult('...É pra Você', { isrc: 'BR1SP1200071' });
const MAIDEN = foundResult('IRON MAIDEN', { isrc: 'NO1R42509310' });
const MISSING = notFoundResult('QZNJX2081700');
const FAILED = errorResult('BXKZM1900338');
const ALL: readonly TrackLookupResult[] = [LOUCA, EPRA, MAIDEN, MISSING, FAILED];

describe('filterResults', () => {
  it('keeps everything, in order, for an empty query', () => {
    expect(filterResults(ALL, '')).toBe(ALL);
  });

  it('keeps everything for a query that is only spaces', () => {
    expect(filterResults(ALL, '   ')).toBe(ALL);
  });

  describe('by track title', () => {
    it('matches part of the title', () => {
      expect(filterResults(ALL, 'ouc')).toEqual([LOUCA]);
    });

    it('ignores case', () => {
      expect(filterResults(ALL, 'iron')).toEqual([MAIDEN]);
      expect(filterResults(ALL, 'IRON')).toEqual([MAIDEN]);
    });

    it('ignores accents, in the title and in the query', () => {
      expect(filterResults(ALL, 'e pra voce')).toEqual([EPRA]);
      expect(filterResults(ALL, 'Você')).toEqual([EPRA]);
      expect(filterResults(ALL, 'voce')).toEqual([EPRA]);
    });

    it('ignores spaces around the query', () => {
      expect(filterResults(ALL, '  louca  ')).toEqual([LOUCA]);
    });

    it('matches punctuation as typed', () => {
      expect(filterResults(ALL, '...')).toEqual([EPRA]);
    });
  });

  describe('by ISRC', () => {
    it('matches part of the ISRC, whatever the case', () => {
      expect(filterResults(ALL, 'bxkzm')).toEqual([LOUCA, FAILED]);
    });

    it('ignores spaces and dashes typed inside the ISRC', () => {
      expect(filterResults(ALL, 'br1sp-12 00071')).toEqual([EPRA]);
    });

    it('matches ISRCs that did not become a track, by their code', () => {
      expect(filterResults(ALL, 'QZNJX')).toEqual([MISSING]);
      expect(filterResults(ALL, 'BXKZM1900338')).toEqual([FAILED]);
    });
  });

  describe('by title or ISRC', () => {
    it('keeps what matches either, once', () => {
      const results = [foundResult('BR1 Song', { isrc: 'BR1SP0000001' })];

      expect(filterResults(results, 'br1')).toEqual(results);
    });

    it('does not match an ISRC without a track by words', () => {
      expect(filterResults([MISSING], 'louca')).toEqual([]);
    });

    it('never matches the status or other fields', () => {
      expect(filterResults(ALL, LookupStatus.NOT_FOUND)).toEqual([]);
    });
  });

  describe('words that are not an ISRC', () => {
    const CODES = [
      foundResult('Song', { isrc: 'BR1SP1200071' }),
      notFoundResult('NO1R42509310'),
      notFoundResult('QZNJX2081700'),
    ];

    it('does not shrink a query in another alphabet into characters that match a code', () => {
      expect(filterResults(CODES, 'Песня 1')).toEqual([]);
    });

    it('does not drop letters with accents: "não" is "NAO", not "NO"', () => {
      expect(filterResults(CODES, 'não')).toEqual([]);
      expect(filterResults(CODES, 'nao')).toEqual([]);
    });

    it('treats accent variants the same way', () => {
      const results = [notFoundResult('XX1NAO000001')];

      expect(filterResults(results, 'não')).toEqual(results);
      expect(filterResults(results, 'nao')).toEqual(results);
      expect(filterResults(results, 'NÃO')).toEqual(results);
    });

    it('does not match across the characters between words', () => {
      expect(filterResults(CODES, 'br1 sp12.0007')).toEqual([]);
    });
  });

  it('is empty when nothing matches', () => {
    expect(filterResults(ALL, 'zzzz')).toEqual([]);
  });

  it('does not match on a query made only of separators, other than the title text', () => {
    expect(filterResults([MISSING, FAILED], '- -')).toEqual([]);
  });

  it('does not change the list it is given', () => {
    const copy = [...ALL];

    filterResults(ALL, 'louca');

    expect(ALL).toEqual(copy);
  });
});
