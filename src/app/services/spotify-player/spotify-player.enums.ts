/** Where the embedded player is in its life: from nothing, through its start, to playing (or to the plain embed). */
export enum SpotifyPlayerState {
  /** Nothing was asked for, or the player was taken down. */
  IDLE = 'idle',
  /** Spotify's script and embed are on their way. */
  STARTING = 'starting',
  /** The embed is loaded and plays the track (also after it swaps to another). */
  READY = 'ready',
  /** The script or the embed failed or stalled: the plain embed of the track takes over until the player is stopped. */
  FAILED = 'failed',
}
