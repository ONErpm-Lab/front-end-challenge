import { formatDuration } from './format-duration';

describe('formatDuration', () => {
  it.each([
    ['zero', 0, '00:00'],
    ['less than half a second rounds down', 499, '00:00'],
    ['half a second rounds up', 500, '00:01'],
    ['one second', 1000, '00:01'],
    ['59 seconds', 59_000, '00:59'],
    ['59.5 seconds carries into the next minute', 59_500, '01:00'],
    ['exactly one minute', 60_000, '01:00'],
    ['a typical track', 215_491, '03:35'],
    ['rounds 177.6 seconds up to 2:58', 177_626, '02:58'],
    ['pads single-digit seconds', 123_000, '02:03'],
    ['59:59', 3_599_000, '59:59'],
    ['an hour does not roll over: there is no hour field', 3_600_000, '60:00'],
    ['a long recording', 5_025_000, '83:45'],
  ])('%s (%i ms → %s)', (_label, durationMs, expected) => {
    expect(formatDuration(durationMs)).toBe(expected);
  });

  it.each([
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
    ['a negative value', -1],
  ])('falls back to 00:00 for %s', (_label, durationMs) => {
    expect(formatDuration(durationMs)).toBe('00:00');
  });
});
