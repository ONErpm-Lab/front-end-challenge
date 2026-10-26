import { Track } from '../../../contract/tracks.interfaces';
import { systemClock } from '../../shared/system-time';
import { Clock } from '../../shared/shared.types';
import { CacheEntry, CachingOptions, TrackFinder } from './finder.interfaces';

/**
 * In-memory cache (Decorator), least recently used first out. It shields Spotify's rate limits and de-duplicates concurrent
 * lookups; nothing is persisted. Failures are never cached, but when Spotify is down (or rate limiting us for
 * a long while) an answer that has just expired is served instead of an error, for `staleIfErrorMs` more.
 */
export class CachingTrackFinder implements TrackFinder {
  private readonly _entries = new Map<string, CacheEntry>();
  private readonly _now: Clock;

  constructor(
    private readonly _inner: TrackFinder,
    private readonly _options: CachingOptions,
  ) {
    this._now = _options.now ?? systemClock;
  }

  public findByIsrc(isrc: string): Promise<Track | null> {
    const now = this._now();
    const cached = this._entries.get(isrc);
    if (cached && cached.expiresAt > now) {
      this._store(isrc, cached); // a read makes it the newest, so the entries nobody asks for are the ones that go
      return cached.result;
    }

    const lookup = this._inner.findByIsrc(isrc);
    const fallback = cached && cached.staleUntil > now ? cached : null;
    const entry: CacheEntry = {
      result: fallback ? lookup.catch(() => fallback.result) : lookup,
      expiresAt: now + this._options.ttlMs,
      staleUntil: now + this._options.ttlMs + (this._options.staleIfErrorMs ?? 0),
    };
    this._store(isrc, entry);
    lookup.catch(() => {
      if (this._entries.get(isrc) === entry) {
        this._entries.delete(isrc);
        if (fallback) {
          // Keep the old answer for the next try, which will ask Spotify again.
          this._store(isrc, fallback);
        }
      }
    });
    return entry.result;
  }

  private _store(isrc: string, entry: CacheEntry): void {
    this._entries.delete(isrc);
    this._entries.set(isrc, entry);
    if (this._entries.size > this._options.maxEntries) {
      const oldest = this._entries.keys().next().value;
      if (oldest !== undefined) {
        this._entries.delete(oldest);
      }
    }
  }
}
