import { LookupErrorCode, LookupStatus, ReleaseDatePrecision } from '../../../models/tracks.enums';
import { Track } from '../../../models/tracks.interfaces';
import { TrackLookupResult } from '../../../models/tracks.types';

export function track(overrides: Partial<Track> = {}): Track {
  const releaseDate = overrides.releaseDate ?? {
    value: '2020-01-02',
    precision: ReleaseDatePrecision.DAY,
  };
  return {
    id: 'track-id',
    isrc: 'BR1SP1200071',
    title: 'Track Title',
    artists: ['Artist One'],
    albumName: 'Album Name',
    coverUrl: 'https://img.test/300.jpg',
    releaseDate,
    releaseDates: [releaseDate],
    durationMs: 215_491,
    spotifyUrl: 'https://open.spotify.com/track/track-id',
    availableInBR: true,
    ...overrides,
  };
}

export function foundResult(title: string, overrides: Partial<Track> = {}): TrackLookupResult {
  const built = track({ title, id: `id-${title}`, ...overrides });
  return { status: LookupStatus.FOUND, isrc: built.isrc, track: built };
}

export function notFoundResult(isrc: string): TrackLookupResult {
  return { status: LookupStatus.NOT_FOUND, isrc };
}

export function errorResult(isrc: string): TrackLookupResult {
  return { status: LookupStatus.ERROR, isrc, code: LookupErrorCode.INTEGRATION_UNAVAILABLE };
}

export function titles(results: readonly TrackLookupResult[]): (string | undefined)[] {
  return results.map((result) =>
    result.status === LookupStatus.FOUND ? result.track.title : undefined,
  );
}
