import { SpotifyTrack } from '../../../api/spotify-web/spotify-web.interfaces';

export interface TrackContext {
  /** The ISRC that was searched (normalized), used as the track's identity for the UI. */
  readonly isrc: string;
  readonly availableInBR: boolean;
  /** Every release Spotify returned for the ISRC, so the track can carry all their dates. */
  readonly releases: readonly SpotifyTrack[];
}
