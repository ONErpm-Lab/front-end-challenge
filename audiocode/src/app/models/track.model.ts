export interface TrackData {
  isrc: string;
  albumThumb: string;
  releaseDate: string;
  title: string;
  artists: string[];
  durationFormated: string;
  previewUrl: string | null;
  spotifyLink: string;
  availableInBR: boolean;
}