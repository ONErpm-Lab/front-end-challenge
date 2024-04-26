import {
  spotifyTracksMockArray,
  trackInfoMockArray,
} from '../../tests/mocks/track-mock';
import formatTracks from './format-track.helper';

describe('formatTrack', () => {
  it('should format tracks correctly', () => {
    const infoTracks = formatTracks(spotifyTracksMockArray);
    expect(infoTracks).toEqual(trackInfoMockArray);
  });
});
