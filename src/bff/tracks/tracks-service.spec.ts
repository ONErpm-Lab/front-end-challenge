// @vitest-environment node
import { LookupErrorCode, LookupStatus, ReleaseDatePrecision } from '../../contract/tracks.enums';
import { Track } from '../../contract/tracks.interfaces';
import { Logger } from '../shared/shared.interfaces';
import { SpotifyUnavailableError } from '../spotify/spotify-errors';
import { SpotifyFailureReason } from '../spotify/spotify.enums';
import { TrackFinder } from './finder/finder.interfaces';
import { TracksService } from './tracks-service';

const track = (isrc: string): Track => ({
  id: `id-${isrc}`,
  isrc,
  title: `Title ${isrc}`,
  artists: ['Artist'],
  albumName: 'Album',
  coverUrl: null,
  releaseDate: { value: '2020', precision: ReleaseDatePrecision.YEAR },
  durationMs: 1000,
  spotifyUrl: 'https://open.spotify.com/track/x',
  availableInBR: true,
});

function setup(findByIsrc: TrackFinder['findByIsrc']) {
  const logger: Logger = { warn: vi.fn(), error: vi.fn() };
  return { service: new TracksService({ findByIsrc }, logger), logger };
}

describe('TracksService.lookup', () => {
  it('reports found and not_found per ISRC, preserving request order', async () => {
    const { service } = setup(async (isrc) => (isrc === 'MISSING' ? null : track(isrc)));

    const results = await service.lookup(['B', 'MISSING', 'A']);

    expect(results).toEqual([
      { status: LookupStatus.FOUND, isrc: 'B', track: track('B') },
      { status: LookupStatus.NOT_FOUND, isrc: 'MISSING' },
      { status: LookupStatus.FOUND, isrc: 'A', track: track('A') },
    ]);
  });

  it('isolates an integration failure to the ISRC that hit it', async () => {
    const { service, logger } = setup(async (isrc) => {
      if (isrc === 'B') {
        throw new SpotifyUnavailableError(SpotifyFailureReason.SEARCH_FAILED, { status: 500 });
      }
      return track(isrc);
    });

    const results = await service.lookup(['A', 'B', 'C']);

    expect(results.map((result) => result.status)).toEqual([
      LookupStatus.FOUND,
      LookupStatus.ERROR,
      LookupStatus.FOUND,
    ]);
    expect(results[1]).toEqual({
      status: LookupStatus.ERROR,
      isrc: 'B',
      code: LookupErrorCode.INTEGRATION_UNAVAILABLE,
    });
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('search_failed'));
  });

  it('reports unexpected errors as internal_error and logs them', async () => {
    const failure = new TypeError('bug');
    const { service, logger } = setup(async () => {
      throw failure;
    });

    const results = await service.lookup(['A']);

    expect(results).toEqual([
      { status: LookupStatus.ERROR, isrc: 'A', code: LookupErrorCode.INTERNAL_ERROR },
    ]);
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('A'), failure);
  });

  it('returns an empty list for no ISRCs', async () => {
    const { service } = setup(async () => null);

    await expect(service.lookup([])).resolves.toEqual([]);
  });
});
