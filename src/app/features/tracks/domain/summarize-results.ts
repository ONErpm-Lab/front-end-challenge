import { LookupStatus } from '../../../models/tracks.enums';
import { Track } from '../../../models/tracks.interfaces';
import { TrackLookupResult } from '../../../models/tracks.types';
import { CatalogSummary, ReleaseYear } from './domain.interfaces';

const YEAR = /^(\d{4})/;

/** The numbers of the summary cards: counts by status, total duration and releases per year. */
export function summarizeResults(results: readonly TrackLookupResult[]): CatalogSummary {
  const tracks = results
    .filter((result) => result.status === LookupStatus.FOUND)
    .map((result) => result.track);
  const count = (status: LookupStatus) =>
    results.filter((result) => result.status === status).length;
  const availableInBR = tracks.filter((track) => track.availableInBR).length;

  return {
    total: results.length,
    found: tracks.length,
    availableInBR,
    unavailableInBR: tracks.length - availableInBR,
    notFound: count(LookupStatus.NOT_FOUND),
    failed: count(LookupStatus.ERROR),
    totalDurationMs: tracks.reduce(
      (sum, track) => sum + (Number.isFinite(track.durationMs) ? Math.max(0, track.durationMs) : 0),
      0,
    ),
    releasesByYear: releasesByYear(tracks),
  };
}

function releasesByYear(tracks: readonly Track[]): readonly ReleaseYear[] {
  const counts = new Map<number, number>();
  for (const track of tracks) {
    const match = YEAR.exec(track.releaseDate.value);
    if (match) {
      const year = Number(match[1]);
      counts.set(year, (counts.get(year) ?? 0) + 1);
    }
  }
  return [...counts].map(([year, count]) => ({ year, count })).sort((a, b) => a.year - b.year);
}
