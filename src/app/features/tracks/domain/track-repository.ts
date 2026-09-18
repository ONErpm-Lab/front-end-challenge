import { Observable } from 'rxjs';
import type { Track } from './track';

/**
 * The seam between the tracks feature and whoever supplies its data.
 *
 * An abstract class rather than an interface so it can double as the DI token:
 * containers inject `TrackRepository` and never learn that Spotify exists (DIP),
 * a different provider is a new implementation rather than an edit (OCP), and a
 * fake in tests satisfies the same contract (LSP).
 *
 * The contract is intentionally one method wide (ISP) — how many HTTP calls the
 * implementation makes, and how it parallelises them, is nobody else's business.
 */
export abstract class TrackRepository {
  /**
   * Resolves ISRC codes to tracks.
   *
   * Codes that cannot be resolved are omitted rather than failing the whole batch;
   * the stream errors only when the provider itself is unusable, which is what
   * drives the alert the spec requires.
   *
   * Spotify has no batch-by-ISRC endpoint usable here — `GET /v1/tracks?ids=` answers
   * 403 for this app tier — so the implementation fans out over
   * `GET /search?q=isrc:{code}&type=track&market={market}`, one call per code. The
   * `market` parameter is required: it is what makes Spotify return `is_playable`,
   * which is the only market signal left now that `available_markets` is absent.
   */
  abstract findByIsrcs(isrcs: readonly string[]): Observable<readonly Track[]>;
}
