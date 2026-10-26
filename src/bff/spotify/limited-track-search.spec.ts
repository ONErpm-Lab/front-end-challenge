// @vitest-environment node
import { ConcurrencyLimiter } from '../shared/concurrency-limiter';
import { spotifyTrack } from '../testing/builders';
import { LimitedTrackSearch } from './limited-track-search';
import { TrackSearch } from './spotify.interfaces';

const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 1));

describe('LimitedTrackSearch', () => {
  it('delegates to the wrapped search with the same arguments', async () => {
    const tracks = [spotifyTrack()];
    const searchByIsrc = vi.fn<TrackSearch['searchByIsrc']>().mockResolvedValue(tracks);
    const limited = new LimitedTrackSearch({ searchByIsrc }, new ConcurrencyLimiter(2));

    await expect(limited.searchByIsrc('BR1SP1200071', { market: 'BR' })).resolves.toBe(tracks);

    expect(searchByIsrc).toHaveBeenCalledExactlyOnceWith('BR1SP1200071', { market: 'BR' });
  });

  it('propagates failures of the wrapped search', async () => {
    const searchByIsrc = vi.fn<TrackSearch['searchByIsrc']>().mockRejectedValue(new Error('down'));
    const limited = new LimitedTrackSearch({ searchByIsrc }, new ConcurrencyLimiter(1));

    await expect(limited.searchByIsrc('A')).rejects.toThrow('down');
  });

  it('keeps simultaneous searches under the limit across independent callers', async () => {
    let running = 0;
    let peak = 0;
    const inner: TrackSearch = {
      searchByIsrc: async () => {
        peak = Math.max(peak, ++running);
        await tick();
        running--;
        return [];
      },
    };
    const limited = new LimitedTrackSearch(inner, new ConcurrencyLimiter(3));

    // Two "requests", each fanning out five searches.
    const requestA = Promise.all(
      Array.from({ length: 5 }, (_, i) => limited.searchByIsrc(`A${i}`)),
    );
    const requestB = Promise.all(
      Array.from({ length: 5 }, (_, i) => limited.searchByIsrc(`B${i}`)),
    );
    await Promise.all([requestA, requestB]);

    expect(peak).toBe(3);
  });
});
