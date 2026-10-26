export interface TrackContext {
  /** The ISRC that was searched (normalized), used as the track's identity for the UI. */
  readonly isrc: string;
  readonly availableInBR: boolean;
}
