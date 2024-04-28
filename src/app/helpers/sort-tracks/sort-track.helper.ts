import MultiTrack from '../../services/multi-track.interface';

export function sortTracks(a: MultiTrack, b: MultiTrack) {
  const nameA = a.tracks.length > 0 ? a.tracks[0].name.toUpperCase() : '';
  const nameB = b.tracks.length > 0 ? b.tracks[0].name.toUpperCase() : '';
  if (nameA < nameB) {
    return -1;
  }
  return 1;
}
