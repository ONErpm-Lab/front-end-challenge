import { LookupErrorCode, LookupStatus } from './tracks.enums';
import { Track } from './tracks.interfaces';

export type TrackLookupResult =
  | { readonly status: LookupStatus.FOUND; readonly isrc: string; readonly track: Track }
  | { readonly status: LookupStatus.NOT_FOUND; readonly isrc: string }
  | {
      readonly status: LookupStatus.ERROR;
      readonly isrc: string;
      readonly code: LookupErrorCode;
    };
