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
  /** How much of `release_date` is meaningful. Spotify often knows only the year. */
  readonly release_date_precision?: 'year' | 'month' | 'day';
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
  /**
   * Whether the track can be played in the requested `market`. Present only when the
   * request sends a `market` parameter, and now the only market signal Spotify gives:
   * `available_markets` is absent from responses for recently created apps.
   */
  readonly is_playable?: boolean;
  /** Why a track is not playable, when Spotify says. */
  readonly restrictions?: { readonly reason?: string };
  /** Legacy market list. Retained as a fallback for tokens that still receive it. */
  readonly available_markets?: readonly string[];
}

export interface SpotifySearchResponseDto {
  readonly tracks?: {
    readonly items?: readonly SpotifyTrackDto[];
  };
}
