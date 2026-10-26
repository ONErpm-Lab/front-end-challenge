// @vitest-environment node
import { SpotifyUnavailableError } from '../../spotify/spotify-errors';
import { SpotifyFailureReason } from '../../spotify/spotify.enums';
import { SpotifyTrack, TrackSearch } from '../../spotify/spotify.interfaces';
import { spotifyAlbum, spotifyTrack } from '../../testing/builders';
import { SpotifyTrackFinder } from './track-finder';

const ISRC = 'BR1SP1200071';

/** Fake search: `withMarket` answers `market=BR` searches, `withoutMarket` answers the unfiltered one. */
function setup(answers: { withMarket: SpotifyTrack[]; withoutMarket?: SpotifyTrack[] }) {
  const searchByIsrc = vi.fn<TrackSearch['searchByIsrc']>(async (_isrc, options) =>
    options?.market ? answers.withMarket : (answers.withoutMarket ?? []),
  );
  return { finder: new SpotifyTrackFinder({ searchByIsrc }), searchByIsrc };
}

const released = (id: string, release_date: string, is_playable?: boolean) =>
  spotifyTrack({ id, is_playable, album: spotifyAlbum({ release_date }) });

describe('SpotifyTrackFinder', () => {
  it('flags a track playable in Brazil as available, with a single search', async () => {
    const { finder, searchByIsrc } = setup({ withMarket: [released('a', '2020-01-01', true)] });

    const track = await finder.findByIsrc(ISRC);

    expect(track).toMatchObject({ id: 'a', isrc: ISRC, availableInBR: true });
    expect(searchByIsrc).toHaveBeenCalledExactlyOnceWith(ISRC, { market: 'BR' });
  });

  it('picks the earliest release among the playable ones', async () => {
    const { finder } = setup({
      withMarket: [released('album', '2014-05-12', true), released('single', '2014-03-25', true)],
    });

    expect((await finder.findByIsrc(ISRC))?.id).toBe('single');
  });

  it('ignores an earlier release that is not playable in Brazil when a playable one exists', async () => {
    const { finder } = setup({
      withMarket: [
        released('blocked', '2010-01-01', false),
        released('playable', '2020-01-01', true),
      ],
    });

    expect(await finder.findByIsrc(ISRC)).toMatchObject({ id: 'playable', availableInBR: true });
  });

  it('flags the track as unavailable when Spotify returns it but not playable in Brazil', async () => {
    const { finder, searchByIsrc } = setup({
      withMarket: [released('blocked', '2020-01-01', false)],
    });

    expect(await finder.findByIsrc(ISRC)).toMatchObject({ id: 'blocked', availableInBR: false });
    expect(searchByIsrc).toHaveBeenCalledTimes(1);
  });

  it('treats a missing is_playable as not playable', async () => {
    const { finder } = setup({ withMarket: [released('unknown', '2020-01-01', undefined)] });

    expect((await finder.findByIsrc(ISRC))?.availableInBR).toBe(false);
  });

  it('falls back to a search without market when Brazil returns nothing, flagging it unavailable', async () => {
    const { finder, searchByIsrc } = setup({
      withMarket: [],
      withoutMarket: [released('elsewhere', '2018-06-01', true)],
    });

    expect(await finder.findByIsrc(ISRC)).toMatchObject({ id: 'elsewhere', availableInBR: false });
    expect(searchByIsrc).toHaveBeenNthCalledWith(1, ISRC, { market: 'BR' });
    expect(searchByIsrc).toHaveBeenNthCalledWith(2, ISRC);
  });

  it('returns null when Spotify has no track for the ISRC', async () => {
    const { finder } = setup({ withMarket: [], withoutMarket: [] });

    expect(await finder.findByIsrc(ISRC)).toBeNull();
  });

  it('propagates integration failures', async () => {
    const searchByIsrc = vi
      .fn<TrackSearch['searchByIsrc']>()
      .mockRejectedValue(new SpotifyUnavailableError(SpotifyFailureReason.SEARCH_FAILED));
    const finder = new SpotifyTrackFinder({ searchByIsrc });

    await expect(finder.findByIsrc(ISRC)).rejects.toBeInstanceOf(SpotifyUnavailableError);
  });
});
