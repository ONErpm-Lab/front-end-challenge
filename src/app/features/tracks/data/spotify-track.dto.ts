/**
 * The wire shape of the Spotify responses we consume.
 *
 * Isolated here so that a change on Spotify's side is a change to this file plus
 * the mapper — never to the domain model, the UI, or the tests above them.
 * Fields are optional because we do not control this payload.
 */

export interface SpotifyImageDto {
  readonly url: string;
  readonly width?: number;
  readonly height?: number;
}

export interface SpotifyArtistDto {
  readonly name?: string;
}

export interface SpotifyAlbumDto {
  readonly images?: readonly SpotifyImageDto[];
  readonly release_date?: string;
}

export interface SpotifyTrackDto {
  readonly id?: string;
  readonly name?: string;
  readonly duration_ms?: number;
  readonly preview_url?: string | null;
  readonly artists?: readonly SpotifyArtistDto[];
  readonly album?: SpotifyAlbumDto;
  readonly external_urls?: { readonly spotify?: string };
  readonly external_ids?: { readonly isrc?: string };
  /** Present only when the request omits a `market` parameter. */
  readonly available_markets?: readonly string[];
}

export interface SpotifySearchResponseDto {
  readonly tracks?: {
    readonly items?: readonly SpotifyTrackDto[];
  };
}
