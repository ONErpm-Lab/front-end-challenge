import { SpotifyTrack } from '../../api/spotify-web/spotify-web.interfaces';

export interface SearchOptions {
  readonly market?: string;
}

/** What the track finder needs from Spotify: every track it lists for an ISRC. */
export interface TrackSearch {
  searchByIsrc(isrc: string, options?: SearchOptions): Promise<readonly SpotifyTrack[]>;
}
