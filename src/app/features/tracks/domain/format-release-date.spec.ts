import { ReleaseDatePrecision } from '../../../models/tracks.enums';
import { ReleaseDate } from '../../../models/tracks.interfaces';
import { formatReleaseDate } from './format-release-date';

const day = (value: string): ReleaseDate => ({ value, precision: ReleaseDatePrecision.DAY });
const month = (value: string): ReleaseDate => ({ value, precision: ReleaseDatePrecision.MONTH });
const year = (value: string): ReleaseDate => ({ value, precision: ReleaseDatePrecision.YEAR });

describe('formatReleaseDate', () => {
  describe('precision', () => {
    it('shows only the year when that is all Spotify knows', () => {
      expect(formatReleaseDate(year('2014'), 'en')).toBe('2014');
    });

    it('shows month and year for a month-precision date, without inventing a day', () => {
      expect(formatReleaseDate(month('2014-05'), 'en')).toBe('May 2014');
    });

    it('shows the full date for a day-precision date', () => {
      expect(formatReleaseDate(day('2014-05-12'), 'en')).toBe('May 12, 2014');
    });
  });

  describe('locale', () => {
    it.each([
      ['en', 'June 13, 2013'],
      ['pt-BR', '13 de junho de 2013'],
      ['es', '13 de junio de 2013'],
      ['ru', '13 июня 2013 г.'],
      ['fr', '13 juin 2013'],
      ['tr', '13 Haziran 2013'],
    ])('%s', (locale, expected) => {
      expect(formatReleaseDate(day('2013-06-13'), locale)).toBe(expected);
    });

    it('names the month in the locale for month precision', () => {
      expect(formatReleaseDate(month('2019-10'), 'pt-BR')).toBe('outubro de 2019');
      expect(formatReleaseDate(month('2019-10'), 'ru')).toBe('октябрь 2019 г.');
    });
  });

  describe('time zone', () => {
    it('never shifts the day: 2013-06-13 stays the 13th, not the 12th as in the Americas', () => {
      expect(formatReleaseDate(day('2013-06-13'), 'en')).toContain('13');
    });

    it.each([
      ['first day of the year', '2020-01-01', 'January 1, 2020'],
      ['last day of the year', '2019-12-31', 'December 31, 2019'],
      ['leap day', '2020-02-29', 'February 29, 2020'],
    ])('keeps the %s', (_label, value, expected) => {
      expect(formatReleaseDate(day(value), 'en')).toBe(expected);
    });

    it('keeps the year of a year-only release (January 1st UTC is still the previous year in the Americas)', () => {
      expect(formatReleaseDate(year('2014'), 'en')).toBe('2014');
    });

    it('keeps the month of a month-only release that starts on the 1st', () => {
      expect(formatReleaseDate(month('2014-03'), 'en')).toBe('March 2014');
    });
  });

  describe('invalid values', () => {
    it.each([
      ['garbage', 'not a date'],
      ['empty', ''],
    ])('returns %s as received instead of "Invalid Date"', (_label, value) => {
      expect(formatReleaseDate(day(value), 'en')).toBe(value);
    });
  });
});
