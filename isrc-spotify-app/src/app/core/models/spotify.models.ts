export interface ISpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface ISpotifyArtist {
  id: string;
  name: string;
  external_urls: any;
}

export interface ISpotifyAlbum {
  id: string;
  name: string;
  images: any[];
  release_date: string;
  release_date_precision: 'day' | 'month' | 'year';
  external_urls: any;
}

export interface ISpotifyTrack {
  id: string;
  name: string;
  artists: ISpotifyArtist[];
  album: ISpotifyAlbum;
  duration_ms: number;
  preview_url: string;
  external_urls: any;
  available_markets: string[];
}
