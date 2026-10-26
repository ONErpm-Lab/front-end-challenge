import { ReleaseDate } from '../../../models/tracks.interfaces';
import { ReleaseDatePrecision } from '../../../models/tracks.enums';

/**
 * Formats a release date in the visitor's locale, showing only what Spotify knows: a year-only
 * release is `2014`, a month-only one is `May 2014` and a full date is `May 12, 2014`.
 *
 * Dates are formatted in UTC: `2013-06-13` parses as midnight UTC, which in the Americas is still
 * the 12th, so formatting in the local time zone would show the wrong day. An unparseable value
 * is returned as received instead of "Invalid Date".
 */
export function formatReleaseDate(releaseDate: ReleaseDate, locale: string): string {
  const date = new Date(releaseDate.value);
  if (Number.isNaN(date.getTime())) {
    return releaseDate.value;
  }

  return new Intl.DateTimeFormat(locale, {
    timeZone: 'UTC',
    ...optionsFor(releaseDate.precision),
  }).format(date);
}

function optionsFor(precision: ReleaseDatePrecision): Intl.DateTimeFormatOptions {
  switch (precision) {
    case ReleaseDatePrecision.YEAR:
      return { year: 'numeric' };
    case ReleaseDatePrecision.MONTH:
      return { year: 'numeric', month: 'long' };
    case ReleaseDatePrecision.DAY:
      return { dateStyle: 'long' };
  }
}
