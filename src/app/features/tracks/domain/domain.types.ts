import { LookupStatus } from '../../../../contract/tracks.enums';

/** The two outcomes that leave an ISRC without a track to show. */
export type UnresolvedStatus = LookupStatus.NOT_FOUND | LookupStatus.ERROR;
