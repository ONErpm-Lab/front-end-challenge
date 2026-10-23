import type { ReleaseDatePrecision } from '../models/track.model';

/** O Spotify devolve "2012", "2012-05" ou "2012-05-10" conforme a precisão. */
export function formatReleaseDate(value: string | null, precision: ReleaseDatePrecision): string {
  if (!value) return 'Data desconhecida';

  const [year = '', month = '01', day = '01'] = value.split('-');
  if (precision === 'year') return year;

  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  const options: Intl.DateTimeFormatOptions =
    precision === 'month'
      ? { month: 'short', year: 'numeric', timeZone: 'UTC' }
      : { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' };

  return new Intl.DateTimeFormat('pt-BR', options).format(date).replace(/\./g, '');
}
