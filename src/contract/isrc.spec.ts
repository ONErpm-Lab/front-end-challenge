import { isValidIsrc, normalizeIsrc } from './isrc';

describe('normalizeIsrc', () => {
  it('upper-cases the value', () => {
    expect(normalizeIsrc('br1sp1200071')).toBe('BR1SP1200071');
  });

  it('removes hyphens and whitespace', () => {
    expect(normalizeIsrc(' BR-1SP-12-00071 ')).toBe('BR1SP1200071');
  });
});

describe('isValidIsrc', () => {
  it.each([
    'NO1R42509310',
    'NO1R42511410',
    'BRC310600002',
    'BR1SP1200071',
    'BR1SP1200070',
    'BR1SP1500002',
    'BXKZM1900338',
    'BXKZM1900345',
    'QZNJX2081700',
    'QZNJX2078148',
  ])('accepts the challenge ISRC %s', (isrc) => {
    expect(isValidIsrc(isrc)).toBe(true);
  });

  it.each([
    ['empty', ''],
    ['too short', 'BR1SP120007'],
    ['too long', 'BR1SP12000711'],
    ['lower case (not normalized)', 'br1sp1200071'],
    ['hyphenated (not normalized)', 'BR-1SP-12-00071'],
    ['digit in country code', '1R1SP1200071'],
    ['letter in year/designation digits', 'BR1SP12A0071'],
    ['symbol', 'BR1SP120007!'],
  ])('rejects %s', (_label, value) => {
    expect(isValidIsrc(value)).toBe(false);
  });
});
