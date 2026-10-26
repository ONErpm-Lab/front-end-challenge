import {
  SPOTIFY_EMBED_URL,
  SPOTIFY_LOCALE_PATTERN,
  SPOTIFY_TRACK_ID_PATTERN,
  SPOTIFY_TRACK_URI_PREFIX,
} from './spotify-player.constants';

/** Whether `locale` is a language tag Spotify's embed can be asked for (`pt-BR`, `es`...). */
export function isSpotifyLocale(locale: string | null | undefined): locale is string {
  return typeof locale === 'string' && SPOTIFY_LOCALE_PATTERN.test(locale);
}

/**
 * URL of Spotify's embedded player for a track, or `null` when the id does not look like a Spotify
 * id. The id is validated before it becomes part of a URL that the page then trusts as an iframe
 * source, so a malformed value can never inject anything. The optional `locale` puts the player in the
 * visitor's language (otherwise it follows the browser's); a value that is not a language tag is left out.
 */
export function buildEmbedUrl(trackId: string, dark: boolean, locale?: string): string | null {
  if (!SPOTIFY_TRACK_ID_PATTERN.test(trackId)) {
    return null;
  }
  const params = [
    dark ? 'theme=0' : null,
    isSpotifyLocale(locale) ? `locale=${locale}` : null,
  ].filter((param) => param !== null);
  return `${SPOTIFY_EMBED_URL}/${trackId}${params.length > 0 ? `?${params.join('&')}` : ''}`;
}

/** The `spotify:track:<id>` address the iFrame API plays, or `null` for an id that is not a Spotify id. */
export function buildTrackUri(trackId: string): string | null {
  return SPOTIFY_TRACK_ID_PATTERN.test(trackId) ? `${SPOTIFY_TRACK_URI_PREFIX}${trackId}` : null;
}
