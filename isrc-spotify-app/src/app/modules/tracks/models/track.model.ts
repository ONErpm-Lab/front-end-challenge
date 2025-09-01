export interface ITrack {
  id: string;
  name: string;
  artists: Array<IArtist>;
  album: IAlbum;
  duration_ms: number;
  preview_url: string | null;
  external_urls: IExternalUrls;
  available_markets: Array<string>;
  isrc: string;
}

export interface IArtist {
  id: string;
  name: string;
  external_urls: IExternalUrls;
}

export interface IAlbum {
  id: string;
  name: string;
  images: Array<IImage>;
  release_date: string;
  release_date_precision: 'day' | 'month' | 'year';
  external_urls: IExternalUrls;
}

export interface IImage {
  url: string;
  height: number;
  width: number;
}

export interface IExternalUrls {
  spotify: string;
}

export interface ISpotifySearchResponse {
  tracks: {
    items: Array<ISpotifyTrack>;
    total: number;
    limit: number;
    offset: number;
  };
}

export interface ISpotifyTrack {
  id: string;
  name: string;
  artists: Array<ISpotifyArtist>;
  album: ISpotifyAlbum;
  duration_ms: number;
  preview_url: string | null;
  external_urls: IExternalUrls;
  available_markets: Array<string>;
  external_ids: {
    isrc: string;
  };
}

export interface ISpotifyArtist {
  id: string;
  name: string;
  external_urls: IExternalUrls;
}

export interface ISpotifyAlbum {
  id: string;
  name: string;
  images: IImage[];
  release_date: string;
  release_date_precision: 'day' | 'month' | 'year';
  external_urls: IExternalUrls;
}
