import { ReleaseDatePrecision } from '../../../contract/tracks.enums';
// @vitest-environment node
import { Track } from '../../../contract/tracks.interfaces';
import { CachingTrackFinder } from './caching-track-finder';
import { TrackFinder } from './finder.interfaces';

const track = (isrc: string): Track => ({
  id: `id-${isrc}`,
  isrc,
  title: 'Title',
  artists: ['Artist'],
  albumName: 'Album',
  coverUrl: null,
  releaseDate: { value: '2020', precision: ReleaseDatePrecision.YEAR },
  durationMs: 1000,
  spotifyUrl: 'https://open.spotify.com/track/x',
  availableInBR: true,
});

function setup(options: { ttlMs?: number; staleIfErrorMs?: number; maxEntries?: number } = {}) {
  const clock = { now: 0 };
  const inner = { findByIsrc: vi.fn<TrackFinder['findByIsrc']>(async (isrc) => track(isrc)) };
  const cache = new CachingTrackFinder(inner, {
    ttlMs: options.ttlMs ?? 1000,
    staleIfErrorMs: options.staleIfErrorMs,
    maxEntries: options.maxEntries ?? 100,
    now: () => clock.now,
  });
  return { cache, inner, clock };
}

describe('CachingTrackFinder', () => {
  it('serves repeated lookups from memory within the TTL', async () => {
    const { cache, inner, clock } = setup({ ttlMs: 1000 });

    const first = await cache.findByIsrc('A');
    clock.now = 999;
    const second = await cache.findByIsrc('A');

    expect(second).toBe(first);
    expect(inner.findByIsrc).toHaveBeenCalledTimes(1);
  });

  it('looks up again once the TTL has elapsed', async () => {
    const { cache, inner, clock } = setup({ ttlMs: 1000 });

    await cache.findByIsrc('A');
    clock.now = 1000;
    await cache.findByIsrc('A');

    expect(inner.findByIsrc).toHaveBeenCalledTimes(2);
  });

  it('keeps ISRCs apart', async () => {
    const { cache, inner } = setup();

    await cache.findByIsrc('A');
    await cache.findByIsrc('B');

    expect(inner.findByIsrc).toHaveBeenCalledTimes(2);
  });

  it('caches "not found" too, so unknown ISRCs do not hammer Spotify', async () => {
    const { cache, inner } = setup();
    inner.findByIsrc.mockResolvedValue(null);

    await cache.findByIsrc('A');
    await expect(cache.findByIsrc('A')).resolves.toBeNull();

    expect(inner.findByIsrc).toHaveBeenCalledTimes(1);
  });

  it('shares one in-flight lookup between concurrent callers', async () => {
    const { cache, inner } = setup();

    await Promise.all([cache.findByIsrc('A'), cache.findByIsrc('A'), cache.findByIsrc('A')]);

    expect(inner.findByIsrc).toHaveBeenCalledTimes(1);
  });

  it('never caches failures', async () => {
    const { cache, inner } = setup();
    inner.findByIsrc.mockRejectedValueOnce(new Error('down'));

    await expect(cache.findByIsrc('A')).rejects.toThrow('down');
    await expect(cache.findByIsrc('A')).resolves.toMatchObject({ isrc: 'A' });

    expect(inner.findByIsrc).toHaveBeenCalledTimes(2);
  });

  describe('when Spotify cannot be asked again', () => {
    it('serves the expired answer within the stale window instead of failing', async () => {
      const { cache, inner, clock } = setup({ ttlMs: 1000, staleIfErrorMs: 5000 });
      const first = await cache.findByIsrc('A');

      clock.now = 2000;
      inner.findByIsrc.mockRejectedValueOnce(new Error('rate limited'));

      await expect(cache.findByIsrc('A')).resolves.toBe(first);
    });

    it('asks Spotify again on the next call, and refreshes once it answers', async () => {
      const { cache, inner, clock } = setup({ ttlMs: 1000, staleIfErrorMs: 5000 });
      await cache.findByIsrc('A');
      clock.now = 2000;
      inner.findByIsrc.mockRejectedValueOnce(new Error('rate limited'));
      await cache.findByIsrc('A');

      const refreshed = await cache.findByIsrc('A');
      await cache.findByIsrc('A'); // fresh again: no new lookup

      expect(refreshed).toMatchObject({ isrc: 'A' });
      expect(inner.findByIsrc).toHaveBeenCalledTimes(3);
    });

    it('fails once the stale window is over', async () => {
      const { cache, inner, clock } = setup({ ttlMs: 1000, staleIfErrorMs: 5000 });
      await cache.findByIsrc('A');

      clock.now = 6000;
      inner.findByIsrc.mockRejectedValueOnce(new Error('down'));

      await expect(cache.findByIsrc('A')).rejects.toThrow('down');
    });

    it('does not serve stale answers unless a window was configured', async () => {
      const { cache, inner, clock } = setup({ ttlMs: 1000 });
      await cache.findByIsrc('A');

      clock.now = 1000;
      inner.findByIsrc.mockRejectedValueOnce(new Error('down'));

      await expect(cache.findByIsrc('A')).rejects.toThrow('down');
    });
  });

  it('evicts the least recently used entry, not the oldest one written', async () => {
    const { cache, inner } = setup({ maxEntries: 2 });

    await cache.findByIsrc('A');
    await cache.findByIsrc('B');
    await cache.findByIsrc('A'); // read: A is now the newest
    await cache.findByIsrc('C'); // evicts B, which nobody asked for
    await cache.findByIsrc('A'); // still cached
    await cache.findByIsrc('B'); // looked up again

    expect(inner.findByIsrc.mock.calls.map(([isrc]) => isrc)).toEqual(['A', 'B', 'C', 'B']);
  });

  it('evicts the oldest entry beyond maxEntries', async () => {
    const { cache, inner } = setup({ maxEntries: 2 });

    await cache.findByIsrc('A');
    await cache.findByIsrc('B');
    await cache.findByIsrc('C'); // evicts A
    await cache.findByIsrc('B'); // still cached
    await cache.findByIsrc('A'); // looked up again

    expect(inner.findByIsrc.mock.calls.map(([isrc]) => isrc)).toEqual(['A', 'B', 'C', 'A']);
  });
});
