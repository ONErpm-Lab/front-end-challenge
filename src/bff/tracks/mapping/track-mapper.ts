import { Track } from '../../../contract/tracks.interfaces';
import { SpotifyImage, SpotifyTrack } from '../../spotify/spotify.interfaces';
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
    releaseDate: { value: dto.album.release_date, precision: dto.album.release_date_precision },
    durationMs: dto.duration_ms,
    spotifyUrl: dto.external_urls.spotify,
    availableInBR: context.availableInBR,
  };
}

function pickCoverUrl(images: readonly SpotifyImage[]): string | null {
  const distance = (image: SpotifyImage) =>
    image.width === null ? Number.POSITIVE_INFINITY : Math.abs(image.width - PREFERRED_COVER_WIDTH);

  const best = [...images].sort((a, b) => distance(a) - distance(b))[0];
  return best?.url ?? null;
}
