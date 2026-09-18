import { Observable, of, throwError } from 'rxjs';
import type { AppError } from '../../../core/errors/app-error';
import type { Track } from '../domain/track';
import { TrackRepository } from '../domain/track-repository';

/**
 * Stand-in for the real repository in container tests.
 *
 * Its existence is the point of the abstract contract: `TracksPage` can be tested
 * end to end without HTTP, and if this class satisfies the contract the container
 * cannot tell it apart from the Spotify implementation (LSP).
 */
export class FakeTrackRepository extends TrackRepository {
  constructor(private readonly result: readonly Track[] | AppError) {
    super();
  }

  override findByIsrcs(): Observable<readonly Track[]> {
    return Array.isArray(this.result)
      ? of(this.result as readonly Track[])
      : throwError(() => this.result);
  }
}
