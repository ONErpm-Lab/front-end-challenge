import { ReleaseDatePipe } from './release-date.pipe';

describe('ReleaseDatePipe', () => {
  const pipe = new ReleaseDatePipe();

  it('renders a full date as dd/mm/yyyy', () => {
    expect(pipe.transform('2019-07-12', 'day')).toBe('12/07/2019');
  });

  it('renders a month-precision date without inventing a day', () => {
    expect(pipe.transform('2012-08', 'month')).toBe('08/2012');
  });

  it('renders a year-precision date as just the year', () => {
    expect(pipe.transform('2012', 'year')).toBe('2012');
  });

  it('never shifts the day across a timezone boundary', () => {
    // Parsed as a Date, this would render as 31/07 in BRT.
    expect(pipe.transform('2012-08-01', 'day')).toBe('01/08/2012');
  });

  it('trusts the stated precision over the string when the string is richer', () => {
    expect(pipe.transform('2012-08-01', 'year')).toBe('2012');
  });

  it('degrades when the string is poorer than the stated precision', () => {
    expect(pipe.transform('2012', 'day')).toBe('2012');
  });

  it.each([null, undefined, ''])('renders a placeholder for %s', (input) => {
    expect(pipe.transform(input)).toBe('—');
  });
});
