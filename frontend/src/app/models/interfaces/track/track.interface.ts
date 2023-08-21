import type { Artist } from "./artist.interface";
import type { Image } from "./image.interface";

interface Track {
  readonly albumName: string;
  readonly albumSpotifyURL: string;
  readonly artists: Artist[];
  readonly availableMarkets: string[];
  readonly durationInMilliseconds: number;
  readonly images: Image[];
  readonly name: string;
  readonly previewURL: string;
  readonly releaseDate: string;
  readonly spotifyURL: string;
}

export type { Track };