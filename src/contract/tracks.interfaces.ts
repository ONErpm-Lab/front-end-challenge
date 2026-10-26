/**
 * Contract shared by the BFF (`src/bff`) and the Angular app. It must stay free of
 * dependencies on either side (no Angular, no Express, nothing from `src/bff` or `src/app`).
 * Its enums (`tracks.enums.ts`) are plain values that exist at runtime on both sides.
 */
import { ApiErrorCode, ReleaseDatePrecision } from './tracks.enums';
import { TrackLookupResult } from './tracks.types';

export interface ReleaseDate {
  /** ISO-like value whose shape follows `precision`: `YYYY`, `YYYY-MM` or `YYYY-MM-DD`. */
  readonly value: string;
  readonly precision: ReleaseDatePrecision;
}

export interface Track {
  readonly id: string;
  readonly isrc: string;
  readonly title: string;
  readonly artists: readonly string[];
  readonly albumName: string;
  readonly coverUrl: string | null;
  readonly releaseDate: ReleaseDate;
  readonly durationMs: number;
  readonly spotifyUrl: string;
  readonly availableInBR: boolean;
}

export interface TracksResponse {
  readonly results: readonly TrackLookupResult[];
}

export interface ApiError {
  readonly code: ApiErrorCode;
  readonly message: string;
  /** Offending values, only present for `invalid_isrc`. */
  readonly invalid?: readonly string[];
}
