import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Page } from '@playwright/test';
import { LookupErrorCode, LookupStatus } from '../../src/contract/tracks.enums';
import { TracksResponse } from '../../src/contract/tracks.interfaces';
import { TrackLookupResult } from '../../src/contract/tracks.types';
import { SpotifySearchResponse } from '../../src/bff/spotify/spotify.interfaces';
import { selectBestTrack } from '../../src/bff/tracks/mapping/select-best-track';
import { toTrack } from '../../src/bff/tracks/mapping/track-mapper';

const FIXTURES = join(__dirname, '..', '..', 'src', 'bff', 'testing', 'fixtures');

/** A transparent 1x1 PNG: the album covers are never fetched from Spotify's CDN. */
const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

/**
 * The 10 ISRCs of the challenge, resolved from the REAL Spotify responses recorded for the BFF
 * tests, through the BFF's own mapper: the page receives exactly what production would send.
 */
export function challengeResults(): TrackLookupResult[] {
  return readdirSync(FIXTURES)
    .filter((file) => file.endsWith('.market-br.json'))
    .sort()
    .map((file) => {
      const isrc = file.replace('.market-br.json', '');
      const recorded = JSON.parse(
        readFileSync(join(FIXTURES, file), 'utf8'),
      ) as SpotifySearchResponse;
      const best = selectBestTrack(recorded.tracks.items.filter((track) => track.is_playable))!;
      return {
        status: LookupStatus.FOUND,
        isrc,
        track: toTrack(best, { isrc, availableInBR: true }),
      };
    });
}

export const notFound = (isrc: string): TrackLookupResult => ({
  status: LookupStatus.NOT_FOUND,
  isrc,
});
export const failed = (isrc: string): TrackLookupResult => ({
  status: LookupStatus.ERROR,
  isrc,
  code: LookupErrorCode.INTEGRATION_UNAVAILABLE,
});

/** Answers the page's `GET /api/tracks` with these results. */
export async function mockTracks(
  page: Page,
  results: readonly TrackLookupResult[] = challengeResults(),
) {
  const body: TracksResponse = { results };
  await page.route('**/api/tracks*', (route) => route.fulfill({ json: body }));
}

const IFRAME_API_URL = 'https://open.spotify.com/embed/iframe-api/v1';

/**
 * A stand-in for Spotify's iFrame API script. Like the real one it replaces the element it is given with a
 * player frame and answers with a controller; unlike it, it plays nothing and records what the page asked in
 * `window.__spotify` (the tracks `created`, `loaded` after a swap and `played`), so tests can see it.
 */
const FAKE_IFRAME_API = `
  window.__spotify = { created: [], loaded: [], played: [], destroyed: 0 };
  window.onSpotifyIframeApiReady({
    createController(element, options, callback) {
      const frame = document.createElement('iframe');
      const embed = (uri) => 'https://open.spotify.com/embed/track/' + uri.split(':')[2];
      frame.src = embed(options.uri);
      frame.height = options.height;
      frame.width = options.width;
      let current = options.uri;
      const listeners = {};
      element.replaceWith(frame);
      window.__spotify.created.push(options);
      frame.addEventListener('load', () => listeners.ready && listeners.ready());
      callback({
        addListener(event, listener) { listeners[event] = listener; },
        loadUri(uri) {
          current = uri;
          window.__spotify.loaded.push(uri);
          frame.src = embed(uri);
        },
        play() { window.__spotify.played.push(current); },
        destroy() { window.__spotify.destroyed++; frame.remove(); },
      });
    },
  });
`;

/** Keeps the tests hermetic: no real request to Spotify's player, script or image CDN. */
export async function isolateSpotify(page: Page) {
  await page.route('https://open.spotify.com/**', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><title>Spotify</title><p>player</p>',
    }),
  );
  await page.route(IFRAME_API_URL, (route) =>
    route.fulfill({ contentType: 'text/javascript', body: FAKE_IFRAME_API }),
  );
  await page.route('https://i.scdn.co/**', (route) =>
    route.fulfill({ contentType: 'image/png', body: PIXEL }),
  );
}
