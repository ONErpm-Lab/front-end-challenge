import type { Track } from '../domain/track';
import type { SpotifyImageDto, SpotifyTrackDto } from './spotify-track.dto';

/**
 * Translates a Spotify payload into the app's {@link Track}.
 *
 * A pure function on purpose: no HTTP, no DI, no Angular — which makes the trickiest
 * part of the feature (defensive parsing of a payload we do not own) cheap to test.
 */
export function toTrack(
  dto: SpotifyTrackDto,
  requestedIsrc: string,
  targetMarket: string,
): Track | null {
  // Without an id and a title there is nothing worth rendering.
  if (!dto.id || !dto.name) {
    return null;
  }

  return {
    isrc: dto.external_ids?.isrc ?? requestedIsrc,
    id: dto.id,
    title: dto.name,
    artists: (dto.artists ?? []).map((artist) => artist.name).filter(isNonEmpty),
    albumImageUrl: pickLargestImage(dto.album?.images),
    releaseDate: dto.album?.release_date ?? '',
    durationMs: dto.duration_ms ?? 0,
    previewUrl: dto.preview_url ?? null,
    spotifyUrl: dto.external_urls?.spotify ?? `https://open.spotify.com/track/${dto.id}`,
    availableInTargetMarket: (dto.available_markets ?? []).includes(targetMarket),
  };
}

/** Spotify returns covers largest-first, but we do not depend on that ordering. */
function pickLargestImage(images: readonly SpotifyImageDto[] | undefined): string | null {
  if (!images?.length) {
    return null;
  }
  return images.reduce((largest, image) =>
    (image.width ?? 0) > (largest.width ?? 0) ? image : largest,
  ).url;
}

const isNonEmpty = (value: string | undefined): value is string =>
  !!value && value.trim().length > 0;
