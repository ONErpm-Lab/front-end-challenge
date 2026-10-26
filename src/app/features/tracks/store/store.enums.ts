export enum TracksLoadStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  READY = 'ready',
  /** The music data provider could not be reached at all. */
  UNAVAILABLE = 'unavailable',
}
