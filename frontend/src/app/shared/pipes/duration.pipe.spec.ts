import { formatDuration } from './duration.pipe';

describe('formatDuration', () => {
  it.each([
    [215000, '03:35'],
    [59_499, '00:59'],
    [600_000, '10:00'],
    [0, '00:00'],
  ])('%i ms → %s', (ms, expected) => expect(formatDuration(ms)).toBe(expected));

  it('protege contra valores inválidos', () => {
    expect(formatDuration(-1)).toBe('--:--');
    expect(formatDuration(Number.NaN)).toBe('--:--');
  });
});
