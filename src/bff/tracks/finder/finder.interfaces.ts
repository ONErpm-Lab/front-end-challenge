import { Track } from '../../../contract/tracks.interfaces';
import { Clock } from '../../shared/shared.types';

/** Resolves an ISRC to a track, or `null` when Spotify has none. Rejects when the integration is down. */
export interface TrackFinder {
  findByIsrc(isrc: string): Promise<Track | null>;
}

export interface CachingOptions {
  readonly ttlMs: number;
  /** After `ttlMs`, an answer is still served for this long if asking Spotify again fails. */
  readonly staleIfErrorMs?: number;
  readonly maxEntries: number;
  readonly now?: Clock;
}

export interface CacheEntry {
  readonly result: Promise<Track | null>;
  readonly expiresAt: number;
  /** Until when the answer may stand in for a failed lookup. */
  readonly staleUntil: number;
}
