export interface SpotifyTokenResponse {
  access_token: string;
  expires_in: number;
}

export interface SpotifySearchResponse {
  tracks: {
    items: SpotifyTrackItem[];
  };
}

export interface SpotifyTrackItem {
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
}

export interface FormattedTrack {
  id: string;
  isrc: string;
  albumThumb: string;
  releaseDate: string;
  title: string;
  artists: string;
  duration: string;
  spotifyUrl: string | null;
  availableInBrazil: boolean;
}
