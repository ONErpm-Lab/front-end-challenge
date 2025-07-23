export interface Track {
  id: string;
  name: string;
  album: {
    images: { url: string }[];
    release_date: string;
  };
  artists: { name: string }[];
  duration_ms: number;
  preview_url: string;
  external_urls: { spotify: string };
  available_markets: string[];
}

export interface SpotifyResponse {
  tracks: {
    items: Track[];
  };
}
