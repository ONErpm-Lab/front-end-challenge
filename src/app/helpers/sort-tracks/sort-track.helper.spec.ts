import TrackInfo from '../../components/track-info/track-info.interface';
import MultiTrack from '../../services/multi-track.interface';
import { spotifyTrackMock } from '../../tests/mocks/track-mock';
import formatTracks from '../format-track/format-track.helper';
import { sortTracks } from './sort-track.helper';

describe('sortTracks', () => {
  let trackInfoMock: TrackInfo;

  beforeEach(() => {
    trackInfoMock = formatTracks([spotifyTrackMock])[0];
  });

  it('should sort tracks alphabetically by the first track name', () => {
    const tracks: MultiTrack[] = [
      { isrc: '', tracks: [{ ...trackInfoMock, name: 'B' }] },
      { isrc: '', tracks: [{ ...trackInfoMock, name: 'A' }] },
      { isrc: '', tracks: [{ ...trackInfoMock, name: 'C' }] },
    ];
    const sortedTracks = tracks.sort(sortTracks);
    expect(sortedTracks).toEqual([
      { isrc: '', tracks: [{ ...trackInfoMock, name: 'A' }] },
      { isrc: '', tracks: [{ ...trackInfoMock, name: 'B' }] },
      { isrc: '', tracks: [{ ...trackInfoMock, name: 'C' }] },
    ]);
  });

  it('should handle empty tracks', () => {
    const tracks: MultiTrack[] = [
      { isrc: '', tracks: [{ ...trackInfoMock, name: 'B' }] },
      { isrc: '', tracks: [] },
      { isrc: '', tracks: [{ ...trackInfoMock, name: 'A' }] },
    ];
    const sortedTracks = tracks.sort(sortTracks);
    expect(sortedTracks).toEqual([
      { isrc: '', tracks: [] },
      { isrc: '', tracks: [{ ...trackInfoMock, name: 'A' }] },
      { isrc: '', tracks: [{ ...trackInfoMock, name: 'B' }] },
    ]);
  });

  // it('should handle tracks with no name', () => {
  //   const tracks: MultiTrack[] = [
  //     { isrc: '', tracks: [{ ...trackInfoMock, name: 'B' }] },
  //     { tracks: [{}] },
  //     { isrc: '', tracks: [{ ...trackInfoMock, name: 'A' }] },
  //   ];
  //   const sortedTracks = tracks.sort(sortTracks);
  //   expect(sortedTracks).toEqual([
  //     { tracks: [{}] },
  //     { tracks: [{ name: 'A' }] },
  //     { tracks: [{ name: 'B' }] },
  //   ]);
  // });

  it('should handle tracks with undefined name', () => {
    const tracks: MultiTrack[] = [
      { isrc: '', tracks: [{ ...trackInfoMock, name: 'B' }] },
      { isrc: '', tracks: [{ ...trackInfoMock, name: '' }] },
      { isrc: '', tracks: [{ ...trackInfoMock, name: 'A' }] },
    ];
    const sortedTracks = tracks.sort(sortTracks);
    expect(sortedTracks).toEqual([
      { isrc: '', tracks: [{ ...trackInfoMock, name: '' }] },
      { isrc: '', tracks: [{ ...trackInfoMock, name: 'A' }] },
      { isrc: '', tracks: [{ ...trackInfoMock, name: 'B' }] },
    ]);
  });
});
