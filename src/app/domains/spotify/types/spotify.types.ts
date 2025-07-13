export interface ISpotifySearchResponse {
  tracks: {
    items: ISearchSpotifyTrack[];
  };
}

export type IMultipleSpotifySearchResponse = {
  isrc: string;
  track: ISearchSpotifyTrack | null;
}[];

export interface ISearchSpotifyTrack {
  id: string;
  name: string;
  album: {
    images: { url: string }[];
    release_date: string;
  };
  artists: { name: string }[];
  duration_ms: number;
  external_urls: { spotify: string };
  available_markets: string[];
  external_ids?: {
    isrc?: string;
  };
  preview_url: string;
}

export interface ISpotifyTrack {
  name: string;
  album: {
    images: { url: string }[];
  };
}
