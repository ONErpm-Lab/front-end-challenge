import { LookupStatus } from '../../../models/tracks.enums';
import { TrackLookupResult } from '../../../models/tracks.types';
import { StatusFilter } from './domain.enums';

/** Whether a result belongs under a status chip. Failed lookups only show under "all". */
export function matchesStatus(result: TrackLookupResult, filter: StatusFilter): boolean {
  switch (filter) {
    case StatusFilter.ALL:
      return true;
    case StatusFilter.AVAILABLE_BR:
      return result.status === LookupStatus.FOUND && result.track.availableInBR;
    case StatusFilter.UNAVAILABLE_BR:
      return result.status === LookupStatus.FOUND && !result.track.availableInBR;
    case StatusFilter.NOT_FOUND:
      return result.status === LookupStatus.NOT_FOUND;
  }
}

/** The results under a status chip, in the order they were given. */
export function filterByStatus(
  results: readonly TrackLookupResult[],
  filter: StatusFilter,
): readonly TrackLookupResult[] {
  return filter === StatusFilter.ALL
    ? results
    : results.filter((result) => matchesStatus(result, filter));
}
