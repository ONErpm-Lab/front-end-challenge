export interface Track {
  title: string;
  artists: string[];
  releaseDate: string;
  albumImage: string;
  durationMs: number;
  previewUrl: string | null;
  externalUrl: string;
  availableInBrazil: boolean;
  notFound: boolean;
}
