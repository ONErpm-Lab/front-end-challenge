import { ITrack } from '../../modules/tracks/models';

export interface ITracksState {
  tracks: Array<ITrack>;
  loading: boolean;
  error: string | null;
}

export interface IBaseExtractResult<T> {
  data: T;
  loading: boolean;
  error: string | null;
}
