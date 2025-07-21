export interface Track {
  title: string;
  artists: string[];
  albumImage: string;
  releaseDate: string;
  durationMs: number;
  previewUrl: string | null;
  externalUrl: string;
  availableMarkets: string[];
}
