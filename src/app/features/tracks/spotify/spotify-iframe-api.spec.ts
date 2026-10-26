import { TestBed } from '@angular/core/testing';
import { SPOTIFY_IFRAME_API_TIMEOUT_MS } from './spotify.constants';
import { SpotifyIframeApi } from './spotify-iframe-api';
import { SpotifyIframeApiObject, SpotifyWindow } from './spotify.interfaces';

const API_URL = 'https://open.spotify.com/embed/iframe-api/v1';
const scripts = () =>
  [...document.head.querySelectorAll<HTMLScriptElement>('script')].filter(
    (script) => script.src === API_URL,
  );
const hook = () => (window as SpotifyWindow).onSpotifyIframeApiReady;
const FAKE_API = { createController: vi.fn() } as SpotifyIframeApiObject;

describe('SpotifyIframeApi', () => {
  afterEach(() => {
    scripts().forEach((script) => script.remove());
    delete (window as SpotifyWindow).onSpotifyIframeApiReady;
  });

  it('adds nothing to the page until asked', () => {
    TestBed.inject(SpotifyIframeApi);

    expect(scripts()).toHaveLength(0);
  });

  it("loads Spotify's own script, asynchronously, when asked", () => {
    const api = TestBed.inject(SpotifyIframeApi);

    void api.load();

    expect(scripts()).toHaveLength(1);
    expect(scripts()[0].async).toBe(true);
  });

  it('answers with the API object once Spotify calls the hook', async () => {
    const api = TestBed.inject(SpotifyIframeApi);
    const loaded = api.load();

    hook()?.(FAKE_API);

    await expect(loaded).resolves.toBe(FAKE_API);
  });

  it('shares one script among all callers', async () => {
    const api = TestBed.inject(SpotifyIframeApi);
    const first = api.load();
    const second = api.load();

    hook()?.(FAKE_API);

    expect(scripts()).toHaveLength(1);
    expect(await first).toBe(await second);
  });

  describe('when Spotify never answers', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('gives up after the timeout, removing the script, so the player can fall back', async () => {
      const api = TestBed.inject(SpotifyIframeApi);
      const stalled = api.load();
      const outcome = expect(stalled).rejects.toThrow('no answer in time');

      await vi.advanceTimersByTimeAsync(SPOTIFY_IFRAME_API_TIMEOUT_MS);

      await outcome;
      expect(scripts()).toHaveLength(0);
    });

    it('does not give up on an answer that arrived in time', async () => {
      const api = TestBed.inject(SpotifyIframeApi);
      const loaded = api.load();

      hook()?.(FAKE_API);
      await vi.advanceTimersByTimeAsync(SPOTIFY_IFRAME_API_TIMEOUT_MS * 2);

      await expect(loaded).resolves.toBe(FAKE_API);
    });
  });

  it('rejects when the script cannot load, removing it so that a later try starts over', async () => {
    const api = TestBed.inject(SpotifyIframeApi);
    const failed = api.load();

    scripts()[0].dispatchEvent(new Event('error'));

    await expect(failed).rejects.toThrow('could not be loaded');
    expect(scripts()).toHaveLength(0);
    void api.load();
    expect(scripts()).toHaveLength(1);
  });
});
