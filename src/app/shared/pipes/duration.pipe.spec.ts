import { DurationPipe } from './duration.pipe';

describe('DurationPipe', () => {
  const pipe = new DurationPipe();

  it.each([
    [0, '00:00'],
    [59_000, '00:59'],
    [60_000, '01:00'],
    [213_000, '03:33'],
    // Over an hour intentionally keeps counting in minutes: the spec asks for mm:ss.
    [3_600_000, '60:00'],
  ])('formats %ims as %s', (input, expected) => {
    expect(pipe.transform(input)).toBe(expected);
  });

  it('truncates sub-second remainders instead of rounding up', () => {
    expect(pipe.transform(1_999)).toBe('00:01');
  });

  // null and undefined hit the same branch, as do NaN and Infinity.
  it.each([null, -1, Number.NaN])('renders a placeholder for %s', (input) => {
    expect(pipe.transform(input as number)).toBe('--:--');
  });
});
