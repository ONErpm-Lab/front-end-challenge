// @vitest-environment node
import { spotifyAlbum, spotifyTrack } from '../../testing/builders';
import { selectBestTrack } from './select-best-track';

const releasedOn = (id: string, release_date: string) =>
  spotifyTrack({ id, album: spotifyAlbum({ release_date }) });

describe('selectBestTrack', () => {
  it('returns undefined for an empty list', () => {
    expect(selectBestTrack([])).toBeUndefined();
  });

  it('returns the only track', () => {
    const only = releasedOn('a', '2020-01-01');

    expect(selectBestTrack([only])).toBe(only);
  });

  it('prefers the earliest release (the original, not the reissue)', () => {
    const album = releasedOn('album', '2014-05-12');
    const single = releasedOn('single', '2014-03-25');

    expect(selectBestTrack([album, single])?.id).toBe('single');
  });

  it('compares dates of different precision correctly', () => {
    const yearOnly = releasedOn('year', '2014');
    const month = releasedOn('month', '2014-03');
    const day = releasedOn('day', '2014-03-25');

    expect(selectBestTrack([day, month, yearOnly])?.id).toBe('year');
    expect(selectBestTrack([day, month])?.id).toBe('month');
  });

  it('keeps Spotify ordering when release dates tie', () => {
    const first = releasedOn('first', '2019-10-04');
    const second = releasedOn('second', '2019-10-04');

    expect(selectBestTrack([first, second])?.id).toBe('first');
    expect(selectBestTrack([second, first])?.id).toBe('second');
  });

  it('does not mutate its input', () => {
    const tracks = [releasedOn('b', '2020-01-01'), releasedOn('a', '2010-01-01')];

    selectBestTrack(tracks);

    expect(tracks.map((track) => track.id)).toEqual(['b', 'a']);
  });
});
