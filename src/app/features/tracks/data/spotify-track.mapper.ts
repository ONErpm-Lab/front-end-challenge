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
    albumImageUrl: pickCoverImage(dto.album?.images),
    releaseDate: dto.album?.release_date ?? '',
    releaseDatePrecision:
      dto.album?.release_date_precision ?? inferPrecision(dto.album?.release_date),
    durationMs: dto.duration_ms ?? 0,
    previewUrl: dto.preview_url ?? null,
    spotifyUrl: dto.external_urls?.spotify ?? `https://open.spotify.com/track/${dto.id}`,
    availableInTargetMarket: isAvailable(dto, targetMarket),
  };
}

/**
 * Spotify no longer returns `available_markets` for recently created apps, so the
 * market question is answered by `is_playable`, which comes back only when the
 * request sends a `market`. The legacy list is still honoured when present, so a
 * token that receives it keeps working.
 */
function isAvailable(dto: SpotifyTrackDto, targetMarket: string): boolean {
  if (typeof dto.is_playable === 'boolean') {
    return dto.is_playable;
  }
  return (dto.available_markets ?? []).includes(targetMarket);
}

/**
 * Spotify usually sends `release_date_precision`, but not always. Falling back to the
 * shape of the string keeps the UI from rendering a day it was never told.
 */
function inferPrecision(releaseDate: string | undefined): 'year' | 'month' | 'day' {
  const segments = (releaseDate ?? '').split('-').length;
  if (segments >= 3) return 'day';
  return segments === 2 ? 'month' : 'year';
}

/**
 * Roughly the widest a cover is ever rendered: one card in a three-column grid on a
 * desktop, or a single column on a phone.
 */
const PREFERRED_COVER_WIDTH = 300;

/**
 * Picks the smallest cover that is still big enough to render sharply, rather than
 * the largest available.
 *
 * Spotify offers 640, 300 and 64 pixel variants. Taking 640 for a ~300px slot costs
 * roughly four times the bytes per card, ten times over, for no visible gain. Falls
 * back to the largest on offer when everything is smaller than we want, and does not
 * assume Spotify's ordering.
 */
function pickCoverImage(images: readonly SpotifyImageDto[] | undefined): string | null {
  if (!images?.length) {
    return null;
  }

  const bigEnough = images.filter((image) => (image.width ?? 0) >= PREFERRED_COVER_WIDTH);

  const chosen = bigEnough.length
    ? // Smallest of the acceptable ones.
      bigEnough.reduce((best, image) => ((image.width ?? 0) < (best.width ?? 0) ? image : best))
    : // Nothing is big enough, so take the best available.
      images.reduce((best, image) => ((image.width ?? 0) > (best.width ?? 0) ? image : best));

  return chosen.url;
}

const isNonEmpty = (value: string | undefined): value is string =>
  !!value && value.trim().length > 0;
