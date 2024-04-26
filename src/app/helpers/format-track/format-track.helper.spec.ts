import formatTracks from './format-track.helper';
import { spotifyTracksMockArray, trackInfoMockArray } from './track-mock';

describe('formatTrack', () => {
  it('should format tracks correctly', () => {
    const infoTracks = formatTracks(spotifyTracksMockArray);
    expect(infoTracks).toEqual(trackInfoMockArray);
  });
});
