import { LookupStatus } from '../../../models/tracks.enums';
import { TrackLookupResult } from '../../../models/tracks.types';
import { RESULT_ORDER, TITLE_SORT_LOCALE } from './domain.constants';
import { SortDirection } from './domain.enums';

/**
 * Orders the page: found tracks alphabetically by title, then ISRCs Spotify does not know,
 * then ISRCs that failed (both by ISRC, since they have no title).
 *
 * Titles ignore case, accents and punctuation, so "...É pra Você" files under E, and digits
 * compare as numbers ("Track 2" before "Track 10"). Equal titles keep their input order.
 * With `SortDirection.DESC` the tracks go from Z to A; the ISRCs without a track stay where they are.
 */
export function sortResults(
  results: readonly TrackLookupResult[],
  locale: string = TITLE_SORT_LOCALE,
  direction: SortDirection = SortDirection.ASC,
): TrackLookupResult[] {
  const collator = new Intl.Collator(locale, {
    sensitivity: 'base',
    numeric: true,
    ignorePunctuation: true,
  });

  return [...results].sort((a, b) => {
    const byKind = RESULT_ORDER[a.status] - RESULT_ORDER[b.status];
    if (byKind !== 0) {
      return byKind;
    }
    if (a.status === LookupStatus.FOUND && b.status === LookupStatus.FOUND) {
      const byTitle = collator.compare(a.track.title, b.track.title);
      return direction === SortDirection.DESC ? -byTitle : byTitle;
    }
    return a.isrc.localeCompare(b.isrc);
  });
}
