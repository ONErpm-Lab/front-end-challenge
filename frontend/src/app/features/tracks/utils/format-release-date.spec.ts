import { formatReleaseDate } from './format-release-date';

describe('formatReleaseDate', () => {
  it('respeita a precisão informada pelo Spotify', () => {
    expect(formatReleaseDate('2006', 'year')).toBe('2006');
    expect(formatReleaseDate('2012-05', 'month')).toMatch(/mai.*2012/);
    expect(formatReleaseDate('2012-05-10', 'day')).toMatch(/10 de mai.* 2012/);
  });

  it('trata data ausente', () => {
    expect(formatReleaseDate(null, 'day')).toBe('Data desconhecida');
  });
});
