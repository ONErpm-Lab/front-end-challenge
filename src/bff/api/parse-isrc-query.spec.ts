// @vitest-environment node
import { MAX_ISRCS_PER_REQUEST } from './api.constants';
import { IsrcQueryKind } from './api.enums';
import { parseIsrcQuery } from './parse-isrc-query';

describe('parseIsrcQuery', () => {
  it('parses a comma-separated list', () => {
    expect(parseIsrcQuery('BR1SP1200071,BR1SP1200070')).toEqual({
      kind: IsrcQueryKind.OK,
      isrcs: ['BR1SP1200071', 'BR1SP1200070'],
    });
  });

  it('parses repeated parameters', () => {
    expect(parseIsrcQuery(['BR1SP1200071', 'BR1SP1200070'])).toEqual({
      kind: IsrcQueryKind.OK,
      isrcs: ['BR1SP1200071', 'BR1SP1200070'],
    });
  });

  it('normalizes case, spaces and hyphens', () => {
    expect(parseIsrcQuery(' br-1sp-12-00071 , BR1SP1200070 ')).toEqual({
      kind: IsrcQueryKind.OK,
      isrcs: ['BR1SP1200071', 'BR1SP1200070'],
    });
  });

  it('de-duplicates keeping first-seen order', () => {
    expect(parseIsrcQuery('BR1SP1200070,BR1SP1200071,br1sp1200070')).toEqual({
      kind: IsrcQueryKind.OK,
      isrcs: ['BR1SP1200070', 'BR1SP1200071'],
    });
  });

  it('ignores empty items produced by stray commas', () => {
    expect(parseIsrcQuery(',BR1SP1200071,,')).toEqual({
      kind: IsrcQueryKind.OK,
      isrcs: ['BR1SP1200071'],
    });
  });

  it.each([
    ['undefined', undefined],
    ['empty string', ''],
    ['only separators', ' , ,'],
    ['an object (qs nesting)', { a: 'b' }],
  ])('treats %s as invalid with nothing to report', (_label, raw) => {
    expect(parseIsrcQuery(raw)).toEqual({ kind: IsrcQueryKind.INVALID, invalid: [] });
  });

  it('lists every malformed ISRC', () => {
    expect(parseIsrcQuery('BR1SP1200071,NOPE,1234')).toEqual({
      kind: IsrcQueryKind.INVALID,
      invalid: ['NOPE', '1234'],
    });
  });

  it('accepts exactly the maximum and rejects one more', () => {
    const make = (count: number) =>
      Array.from({ length: count }, (_, i) => `BR1SP12${String(i).padStart(5, '0')}`).join(',');

    expect(parseIsrcQuery(make(MAX_ISRCS_PER_REQUEST)).kind).toBe(IsrcQueryKind.OK);
    expect(parseIsrcQuery(make(MAX_ISRCS_PER_REQUEST + 1))).toEqual({
      kind: IsrcQueryKind.TOO_MANY,
    });
  });
});
