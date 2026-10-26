import { errorResult, foundResult, notFoundResult } from '../testing/builders';
import { StatusFilter } from './domain.enums';
import { filterByStatus, matchesStatus } from './filter-by-status';

const AVAILABLE = foundResult('Louca', { isrc: 'BXKZM1900345' });
const UNAVAILABLE = foundResult('Repente', { isrc: 'BRC310600002', availableInBR: false });
const MISSING = notFoundResult('QZNJX2081700');
const FAILED = errorResult('BXKZM1900338');
const ALL = [AVAILABLE, UNAVAILABLE, MISSING, FAILED];

describe('filterByStatus', () => {
  it('keeps everything, as the same list, under "all"', () => {
    expect(filterByStatus(ALL, StatusFilter.ALL)).toBe(ALL);
  });

  it('keeps only the tracks playable in Brazil', () => {
    expect(filterByStatus(ALL, StatusFilter.AVAILABLE_BR)).toEqual([AVAILABLE]);
  });

  it('keeps only the tracks Spotify has but does not play in Brazil', () => {
    expect(filterByStatus(ALL, StatusFilter.UNAVAILABLE_BR)).toEqual([UNAVAILABLE]);
  });

  it('keeps only the ISRCs Spotify does not know', () => {
    expect(filterByStatus(ALL, StatusFilter.NOT_FOUND)).toEqual([MISSING]);
  });

  it('never puts a failed lookup under a specific status', () => {
    for (const filter of [
      StatusFilter.AVAILABLE_BR,
      StatusFilter.UNAVAILABLE_BR,
      StatusFilter.NOT_FOUND,
    ]) {
      expect(matchesStatus(FAILED, filter)).toBe(false);
    }
  });
});
