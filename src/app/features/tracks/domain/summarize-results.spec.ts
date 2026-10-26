import { ReleaseDatePrecision } from '../../../models/tracks.enums';
import { errorResult, foundResult, notFoundResult } from '../testing/builders';
import { summarizeResults } from './summarize-results';

const day = (value: string) => ({ value, precision: ReleaseDatePrecision.DAY });

describe('summarizeResults', () => {
  it('is all zeros for no results', () => {
    expect(summarizeResults([])).toEqual({
      total: 0,
      found: 0,
      availableInBR: 0,
      unavailableInBR: 0,
      notFound: 0,
      failed: 0,
      totalDurationMs: 0,
      releasesByYear: [],
    });
  });

  it('counts every status', () => {
    const summary = summarizeResults([
      foundResult('A', { availableInBR: true }),
      foundResult('B', { availableInBR: false }),
      foundResult('C', { availableInBR: true }),
      notFoundResult('QZNJX2081700'),
      errorResult('BXKZM1900338'),
    ]);

    expect(summary).toMatchObject({
      total: 5,
      found: 3,
      availableInBR: 2,
      unavailableInBR: 1,
      notFound: 1,
      failed: 1,
    });
  });

  it('adds up the durations of the found tracks, ignoring broken values', () => {
    const summary = summarizeResults([
      foundResult('A', { durationMs: 215_491 }),
      foundResult('B', { durationMs: 135_111 }),
      foundResult('C', { durationMs: Number.NaN }),
      foundResult('D', { durationMs: -5 }),
    ]);

    expect(summary.totalDurationMs).toBe(350_602);
  });

  it('groups releases by year, oldest first, whatever the date precision', () => {
    const summary = summarizeResults([
      foundResult('A', { releaseDate: day('2025-11-28') }),
      foundResult('B', { releaseDate: day('2014-03-25') }),
      foundResult('C', { releaseDate: { value: '2014', precision: ReleaseDatePrecision.YEAR } }),
      foundResult('D', {
        releaseDate: { value: '2019-10', precision: ReleaseDatePrecision.MONTH },
      }),
    ]);

    expect(summary.releasesByYear).toEqual([
      { year: 2014, count: 2 },
      { year: 2019, count: 1 },
      { year: 2025, count: 1 },
    ]);
  });

  it('leaves out a release date it cannot read', () => {
    const summary = summarizeResults([
      foundResult('A', { releaseDate: { value: 'unknown', precision: ReleaseDatePrecision.DAY } }),
    ]);

    expect(summary.releasesByYear).toEqual([]);
  });
});
