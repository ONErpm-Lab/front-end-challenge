import { ReleaseDate, Track } from '../../../models/tracks.interfaces';
import { SpotifyImage, SpotifyTrack } from '../../../api/spotify-web/spotify-web.interfaces';
import { TrackContext } from './mapping.interfaces';

/** Thumbnail size we render; the API offers 640/300/64. */
const PREFERRED_COVER_WIDTH = 300;

/** Anti-corruption layer: the only place that knows Spotify's payload shape. */
export function toTrack(dto: SpotifyTrack, context: TrackContext): Track {
  return {
    id: dto.id,
    isrc: context.isrc,
    title: dto.name,
    artists: dto.artists.map((artist) => artist.name),
    albumName: dto.album.name,
    coverUrl: pickCoverUrl(dto.album.images),
    releaseDate: releaseDateOf(dto),
    releaseDates: distinctReleaseDates([dto, ...context.releases]),
    durationMs: dto.duration_ms,
    spotifyUrl: dto.external_urls.spotify,
    availableInBR: context.availableInBR,
  };
}

function releaseDateOf(dto: SpotifyTrack): ReleaseDate {
  return { value: dto.album.release_date, precision: dto.album.release_date_precision };
}

/** Each date once, oldest first (`YYYY`, `YYYY-MM`, `YYYY-MM-DD` sort correctly as text). */
function distinctReleaseDates(releases: readonly SpotifyTrack[]): readonly ReleaseDate[] {
  const byValue = new Map<string, ReleaseDate>();
  for (const release of releases) {
    const date = releaseDateOf(release);
    if (!byValue.has(date.value)) {
      byValue.set(date.value, date);
    }
  }
  return [...byValue.values()].sort((a, b) => a.value.localeCompare(b.value));
}

function pickCoverUrl(images: readonly SpotifyImage[]): string | null {
  const distance = (image: SpotifyImage) =>
    image.width === null ? Number.POSITIVE_INFINITY : Math.abs(image.width - PREFERRED_COVER_WIDTH);

  const best = [...images].sort((a, b) => distance(a) - distance(b))[0];
  return best?.url ?? null;
}
