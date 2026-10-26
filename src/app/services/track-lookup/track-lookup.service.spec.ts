import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { SpotifyApiError } from '../../api/spotify-web/spotify-api-error';
import { SpotifyApiFailure } from '../../api/spotify-web/spotify-web.enums';
import { SpotifyTrack } from '../../api/spotify-web/spotify-web.interfaces';
import { CHALLENGE_ISRCS, recordedTracks } from '../../api/spotify-web/testing/fixtures';
import { LookupErrorCode, LookupStatus } from '../../models/tracks.enums';
import { SpotifySearchService } from './spotify-search.service';
import { MAX_CONCURRENT_SEARCHES } from './track-lookup.constants';
import { TrackLookupService } from './track-lookup.service';
import { TracksUnavailableError } from './tracks-unavailable-error';

function setup(search: SpotifySearchService['searchByIsrc']) {
  const searchByIsrc = vi.fn(search);
  TestBed.configureTestingModule({
    providers: [{ provide: SpotifySearchService, useValue: { searchByIsrc } }],
  });
  return { lookup: TestBed.inject(TrackLookupService), searchByIsrc };
}

/** Spotify, answered with the real responses recorded for the ten ISRCs of the challenge. */
const recorded = async (isrc: string): Promise<readonly SpotifyTrack[]> => recordedTracks(isrc);

describe('TrackLookup', () => {
  it('finds the ten tracks of the challenge, all playable in Brazil, in the order asked', async () => {
    const { lookup } = setup(recorded);

    const results = await firstValueFrom(lookup.lookup(CHALLENGE_ISRCS));

    expect(results.map((result) => result.isrc)).toEqual(CHALLENGE_ISRCS);
    expect(results.every((result) => result.status === LookupStatus.FOUND)).toBe(true);
    const louca = results.find((result) => result.isrc === 'BXKZM1900345');
    expect(louca).toMatchObject({
      track: { title: 'Louca', availableInBR: true, id: '1Esxp6lXJWU7TaOQM2JsQn' },
    });
  });

  it('carries every release date of the recorded answers: 3 ISRCs have two', async () => {
    const { lookup } = setup(recorded);

    const results = await firstValueFrom(lookup.lookup(CHALLENGE_ISRCS));

    const dates = Object.fromEntries(
      results.map((result) => [
        result.isrc,
        result.status === LookupStatus.FOUND
          ? result.track.releaseDates.map((date) => date.value)
          : [],
      ]),
    );
    expect(dates['BR1SP1200070']).toEqual(['2014-05-12', '2014-07-28']);
    expect(dates['BR1SP1200071']).toEqual(['2014-03-25', '2014-05-12']);
    expect(dates['BXKZM1900345']).toEqual(['2019-10-04', '2019-10-05']);
    expect(Object.values(dates).filter((values) => values.length > 1)).toHaveLength(3);
  });

  it('says which ISRCs Spotify does not know', async () => {
    const { lookup } = setup(async (isrc) => (isrc === 'XX1AA2600001' ? [] : recordedTracks(isrc)));

    const results = await firstValueFrom(lookup.lookup(['BXKZM1900345', 'XX1AA2600001']));

    expect(results[1]).toEqual({ status: LookupStatus.NOT_FOUND, isrc: 'XX1AA2600001' });
  });

  it('keeps a failure to the ISRC that hit it', async () => {
    const { lookup } = setup(async (isrc) => {
      if (isrc === 'BXKZM1900338') {
        throw new SpotifyApiError(SpotifyApiFailure.HTTP, 500);
      }
      return recordedTracks(isrc);
    });

    const results = await firstValueFrom(lookup.lookup(['BXKZM1900345', 'BXKZM1900338']));

    expect(results[0].status).toBe(LookupStatus.FOUND);
    expect(results[1]).toEqual({
      status: LookupStatus.ERROR,
      isrc: 'BXKZM1900338',
      code: LookupErrorCode.INTEGRATION_UNAVAILABLE,
    });
  });

  it('fails as unavailable when no ISRC could be looked up', async () => {
    const { lookup } = setup(async () => {
      throw new SpotifyApiError(SpotifyApiFailure.NETWORK);
    });

    await expect(firstValueFrom(lookup.lookup(CHALLENGE_ISRCS))).rejects.toBeInstanceOf(
      TracksUnavailableError,
    );
  });

  it('asks for nothing when there is nothing to look up', async () => {
    const { lookup, searchByIsrc } = setup(recorded);

    await expect(firstValueFrom(lookup.lookup([]))).resolves.toEqual([]);
    expect(searchByIsrc).not.toHaveBeenCalled();
  });

  it(`never has more than ${MAX_CONCURRENT_SEARCHES} searches at Spotify at once`, async () => {
    let inFlight = 0;
    let peak = 0;
    const { lookup } = setup(async (isrc) => {
      inFlight++;
      peak = Math.max(peak, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 1));
      inFlight--;
      return recordedTracks(isrc);
    });

    await firstValueFrom(lookup.lookup(CHALLENGE_ISRCS));

    expect(peak).toBe(MAX_CONCURRENT_SEARCHES);
  });
});
