import { TestBed } from '@angular/core/testing';
import { SpotifyApiError } from '../../api/spotify-web/spotify-api-error';
import { SpotifySearchApiService } from '../../api/spotify-web/spotify-search-api.service';
import { SpotifyApiFailure } from '../../api/spotify-web/spotify-web.enums';
import { SearchPage, SpotifyTrack } from '../../api/spotify-web/spotify-web.interfaces';
import { spotifyTrack } from '../../api/spotify-web/testing/builders';
import { NOW, SLEEP } from '../common/time';
import { SpotifySearchService } from './spotify-search.service';

type Answer = SearchPage | SpotifyApiError;

/** Each call to Spotify takes the next answer. */
function setup(answers: Answer[]) {
  const clock = { now: 1_000_000 };
  const searchPage = vi.fn<SpotifySearchApiService['searchPage']>(async () => {
    const answer = answers.shift();
    if (!answer) {
      throw new Error('No more answers');
    }
    if (answer instanceof SpotifyApiError) {
      throw answer;
    }
    return answer;
  });
  const sleep = vi.fn(async () => undefined);
  TestBed.configureTestingModule({
    providers: [
      { provide: SpotifySearchApiService, useValue: { searchPage } },
      { provide: NOW, useValue: () => clock.now },
      { provide: SLEEP, useValue: sleep },
    ],
  });
  return { search: TestBed.inject(SpotifySearchService), searchPage, sleep, clock };
}

const page = (items: SpotifyTrack[], hasNext = false): SearchPage => ({ items, hasNext });
const http = (status: number, retryAfterMs?: number) =>
  new SpotifyApiError(SpotifyApiFailure.HTTP, status, retryAfterMs);

describe('SpotifySearch', () => {
  it('searches the ISRC in the market', async () => {
    const track = spotifyTrack();
    const { search, searchPage } = setup([page([track])]);

    await expect(search.searchByIsrc('BR1SP1200071', { market: 'BR' })).resolves.toEqual([track]);

    expect(searchPage).toHaveBeenCalledExactlyOnceWith({
      isrc: 'BR1SP1200071',
      market: 'BR',
      offset: 0,
    });
  });

  describe('pages', () => {
    it('follows the next pages, 10 at a time, and returns every track', async () => {
      const { search, searchPage } = setup([
        page([spotifyTrack({ id: 'a' })], true),
        page([spotifyTrack({ id: 'b' })], false),
      ]);

      const tracks = await search.searchByIsrc('BR1SP1200071');

      expect(tracks.map((track) => track.id)).toEqual(['a', 'b']);
      expect(searchPage.mock.calls.map(([query]) => query.offset)).toEqual([0, 10]);
    });

    it('never asks for more than 5 pages', async () => {
      const { search, searchPage } = setup(Array.from({ length: 8 }, () => page([], true)));

      await search.searchByIsrc('BR1SP1200071');

      expect(searchPage).toHaveBeenCalledTimes(5);
    });

    it('fails the whole search when a later page fails', async () => {
      const { search } = setup([page([spotifyTrack()], true), http(500)]);

      await expect(search.searchByIsrc('BR1SP1200071')).rejects.toMatchObject({ status: 500 });
    });
  });

  describe('rate limit (429)', () => {
    it('waits what Spotify asked and tries once more', async () => {
      const track = spotifyTrack();
      const { search, sleep } = setup([http(429, 2000), page([track])]);

      await expect(search.searchByIsrc('BR1SP1200071')).resolves.toEqual([track]);
      expect(sleep).toHaveBeenCalledExactlyOnceWith(2000);
    });

    it('assumes a short wait when Spotify does not say', async () => {
      const { search, sleep } = setup([http(429), page([])]);

      await search.searchByIsrc('BR1SP1200071');

      expect(sleep).toHaveBeenCalledExactlyOnceWith(1000);
    });

    it('tries only once more', async () => {
      const { search, searchPage } = setup([http(429, 1000), http(429, 1000)]);

      await expect(search.searchByIsrc('BR1SP1200071')).rejects.toMatchObject({ status: 429 });
      expect(searchPage).toHaveBeenCalledTimes(2);
    });

    it('fails at once, without waiting, when the wait is too long', async () => {
      const { search, sleep } = setup([http(429, 30_000)]);

      await expect(search.searchByIsrc('A')).rejects.toMatchObject({
        status: 429,
        retryAfterMs: 30_000,
      });
      expect(sleep).not.toHaveBeenCalled();
    });

    it('keeps the other searches from calling Spotify until the wait is over', async () => {
      const track = spotifyTrack();
      const { search, searchPage, clock } = setup([http(429, 30_000), page([track])]);
      await search.searchByIsrc('A').catch(() => undefined);

      await expect(search.searchByIsrc('B')).rejects.toMatchObject({ status: 429 });
      expect(searchPage).toHaveBeenCalledTimes(1);

      clock.now += 30_000;
      await expect(search.searchByIsrc('C')).resolves.toEqual([track]);
    });

    it('makes the next search wait out what is left of a short wait', async () => {
      const { search, sleep, clock } = setup([http(429, 2000), page([]), page([])]);
      await search.searchByIsrc('A');
      sleep.mockClear();
      clock.now += 500;

      await search.searchByIsrc('B');

      expect(sleep).toHaveBeenCalledExactlyOnceWith(1500);
    });
  });

  it.each([
    ['another error status', http(503)],
    ['a refused token the interceptor could not renew', http(401)],
    ['a network failure', new SpotifyApiError(SpotifyApiFailure.NETWORK)],
    ['a malformed answer', new SpotifyApiError(SpotifyApiFailure.MALFORMED)],
  ])('passes %s on, without retrying', async (_label, error) => {
    const { search, searchPage } = setup([error]);

    await expect(search.searchByIsrc('A')).rejects.toBe(error);
    expect(searchPage).toHaveBeenCalledTimes(1);
  });
});
