import { Pipe, PipeTransform } from '@angular/core';

export type DatePrecision = 'year' | 'month' | 'day';

/**
 * Renders a Spotify release date in pt-BR, showing only as much as is actually known.
 *
 * Works on the string rather than a `Date`: parsing `'2012-08-01'` as a Date reads it
 * as UTC midnight, which in BRT renders as 31/07 — a whole day earlier than Spotify
 * said. String handling cannot drift.
 */
@Pipe({ name: 'releaseDate' })
export class ReleaseDatePipe implements PipeTransform {
  transform(isoDate: string | null | undefined, precision: DatePrecision = 'day'): string {
    const [year, month, day] = (isoDate ?? '').split('-');

    if (!year) {
      return '—';
    }

    if (precision === 'year' || !month) {
      return year;
    }

    if (precision === 'month' || !day) {
      return `${month}/${year}`;
    }

    return `${day}/${month}/${year}`;
  }
}
