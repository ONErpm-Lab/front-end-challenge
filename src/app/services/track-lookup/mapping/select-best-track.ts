import { SpotifyTrack } from '../../../api/spotify-web/spotify-web.interfaces';

/**
 * The same ISRC can be published on several releases (album + single, reissues).
 * We show the original one: earliest release date, ties broken by Spotify's own ordering.
 * `release_date` strings (`YYYY`, `YYYY-MM`, `YYYY-MM-DD`) sort correctly as text.
 */
export function selectBestTrack(tracks: readonly SpotifyTrack[]): SpotifyTrack | undefined {
  return [...tracks].sort((a, b) => a.album.release_date.localeCompare(b.album.release_date))[0];
}
