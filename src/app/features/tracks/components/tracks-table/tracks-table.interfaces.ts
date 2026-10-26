export interface TrackPick {
  readonly isrc: string;
  /** The control the visitor used, so the focus can go back to it when the detail sheet closes. */
  readonly opener: HTMLElement;
}
