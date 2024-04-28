import TrackInfo from '../components/track-info/track-info.interface';

export default interface MultiTrack {
  isrc: string;
  tracks: TrackInfo[];
}
