/**
 * The app's model of a track, independent of Spotify's payload (the mapping lives in
 * `services/track-lookup/mapping`). Plain types: no Angular, nothing from `api/` or `services/`.
 */
import { ReleaseDatePrecision } from './tracks.enums';

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
  /** The date shown: the earliest release of the ISRC. */
  readonly releaseDate: ReleaseDate;
  /**
   * Every distinct date Spotify has for the ISRC (album, single, reissue…), oldest first; it includes
   * `releaseDate`. More than one means the releases disagree.
   */
  readonly releaseDates: readonly ReleaseDate[];
  readonly durationMs: number;
  readonly spotifyUrl: string;
  readonly availableInBR: boolean;
}
