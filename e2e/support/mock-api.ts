import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Page } from '@playwright/test';

const FIXTURES = join(
  __dirname,
  '..',
  '..',
  'src',
  'app',
  'api',
  'spotify-web',
  'testing',
  'fixtures',
);

/** A transparent 1x1 PNG: the album covers are never fetched from Spotify's CDN. */
const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

/** The REAL `GET /v1/search?q=isrc:…&market=BR` answer recorded for an ISRC of the challenge. */
function recorded(isrc: string): unknown {
  return JSON.parse(readFileSync(join(FIXTURES, `${isrc}.market-br.json`), 'utf8'));
}

export interface SpotifyMockOptions {
  /** Spotify refuses the app credentials: no token, so nothing can be looked up. */
  readonly refuseCredentials?: boolean;
  /** ISRCs Spotify has no track for. */
  readonly notFound?: readonly string[];
  /** ISRCs whose search fails (HTTP 500). */
  readonly failing?: readonly string[];
}

/**
 * Plays Spotify for the browser: its accounts service (the app token) and its Web API, which answers with the
 * responses recorded for the ten ISRCs. The page then runs exactly as in production.
 */
export async function mockSpotify(page: Page, options: SpotifyMockOptions = {}) {
  await page.route('https://accounts.spotify.com/api/token', (route) =>
    options.refuseCredentials
      ? route.fulfill({ status: 400, headers: CORS, json: { error: 'invalid_client' } })
      : route.fulfill({
          headers: CORS,
          json: { access_token: 'e2e-token', token_type: 'Bearer', expires_in: 3600 },
        }),
  );
  await page.route('https://api.spotify.com/v1/search**', (route) => {
    const request = route.request();
    if (request.method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: CORS });
    }
    const isrc = new URL(request.url()).searchParams.get('q')?.replace('isrc:', '') ?? '';
    if (options.failing?.includes(isrc)) {
      return route.fulfill({ status: 500, headers: CORS, json: { error: { status: 500 } } });
    }
    const body = options.notFound?.includes(isrc)
      ? { tracks: { items: [], next: null } }
      : recorded(isrc);
    return route.fulfill({ headers: CORS, json: body });
  });
}

/** What Spotify sends so the browser lets the page read its answers. */
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization',
};

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
