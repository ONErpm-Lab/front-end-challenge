import { LookupStatus } from '../../../../contract/tracks.enums';
import { TrackLookupResult } from '../../../../contract/tracks.types';

/** Lower case, with accents and marks removed: "É pra Você" matches "e pra voce". */
function fold(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

/**
 * What an ISRC is compared by: accents folded, capitals, and only the spaces and dashes people type inside a
 * code removed ("br1sp-12 00071" matches "BR1SP1200071"). Nothing else is dropped, so a title typed in another
 * alphabet ("Песня 1") never shrinks into a few characters that happen to match some code.
 */
function compact(text: string): string {
  return fold(text).toUpperCase().replace(/[\s-]/g, '');
}

/**
 * The results whose track title or ISRC contain what the visitor typed (ignoring case, accents and the
 * separators people put in an ISRC). ISRCs without a track have no title, so only their code can match.
 * An empty query keeps everything, in the same order.
 */
export function filterResults(
  results: readonly TrackLookupResult[],
  query: string,
): readonly TrackLookupResult[] {
  const folded = fold(query.trim());
  if (folded === '') {
    return results;
  }
  const code = compact(query);

  return results.filter((result) => {
    const codeMatches = code !== '' && compact(result.isrc).includes(code);
    const titleMatches =
      result.status === LookupStatus.FOUND && fold(result.track.title).includes(folded);
    return codeMatches || titleMatches;
  });
}
