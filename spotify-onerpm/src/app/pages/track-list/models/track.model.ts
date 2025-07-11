export interface Track {
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
