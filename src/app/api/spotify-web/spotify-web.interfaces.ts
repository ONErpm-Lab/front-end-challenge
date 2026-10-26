/** The subset of the Spotify Web API payloads the app reads (https://developer.spotify.com/documentation/web-api). */
import { ReleaseDatePrecision } from '../../models/tracks.enums';

export interface SpotifyImage {
  readonly url: string;
  readonly width: number | null;
  readonly height: number | null;
}

export interface SpotifyArtist {
  readonly id: string;
  readonly name: string;
}

export interface SpotifyAlbum {
  readonly name: string;
  readonly images: readonly SpotifyImage[];
  readonly release_date: string;
  readonly release_date_precision: ReleaseDatePrecision;
}

export interface SpotifyTrack {
  readonly id: string;
  readonly name: string;
  readonly artists: readonly SpotifyArtist[];
  readonly album: SpotifyAlbum;
  readonly duration_ms: number;
  readonly external_urls: { readonly spotify: string };
  /** Present when the request carried a `market`. */
  readonly is_playable?: boolean;
}

export interface SpotifySearchResponse {
  readonly tracks: {
    readonly items: readonly SpotifyTrack[];
    /** URL of the next page, or `null` on the last one. */
    readonly next: string | null;
  };
}

/** One validated page of search results. */
export interface SearchPage {
  readonly items: readonly SpotifyTrack[];
  readonly hasNext: boolean;
}

export interface SearchPageQuery {
  readonly isrc: string;
  /** Spotify only says whether a track is playable (`is_playable`) when it is given a market. */
  readonly market?: string;
  readonly offset: number;
}
