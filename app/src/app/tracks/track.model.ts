export interface Track {
  title: string;
  artists: string[];
  albumImage: string;
  releaseDate: string;
  duration: string;
  previewUrl: string | null;
  spotifyUrl: string;
  availableInBrazil: boolean;
}
