import { expect, test } from '@playwright/test';
import { createServer, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * The Vercel function (api/index.mjs) is the same Angular SSR server, called as `(request, response)` instead of
 * listening on a port. This puts it behind a plain Node HTTP server, as Vercel does, and asks it the questions a
 * browser would: if the entry or the build output moves, this fails before a deploy does.
 */
let server: Server;
let origin: string;

// No browser is involved: running it once is enough.
test.skip(({ isMobile }) => isMobile, 'The function is the same for every browser');

test.beforeAll(async () => {
  // No Spotify credentials (an empty value also wins over any local .env): the BFF must say "unavailable".
  process.env['SPOTIFY_CLIENT_ID'] = '';
  process.env['SPOTIFY_CLIENT_SECRET'] = '';
  process.env['NG_ALLOWED_HOSTS'] = '127.0.0.1';

  const entry = await import(pathToFileURL(join(process.cwd(), 'api', 'index.mjs')).href);
  server = createServer(entry.default);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

test.afterAll(async () => {
  if (!server) return;
  await new Promise((resolve) => server.close(resolve));
});

test('renders the page, as the function that Vercel runs', async ({ request }) => {
  const response = await request.get(`${origin}/`);
  const html = await response.text();

  expect(response.status()).toBe(200);
  expect(html).toContain('<html lang="en"');
  expect(html).toContain('<orp-root');
});

test('renders on the server behind the headers that Vercel adds, in the language asked for', async ({
  request,
}) => {
  const response = await request.get(`${origin}/`, {
    headers: {
      'accept-language': 'pt-BR',
      'x-forwarded-for': '203.0.113.7',
      'x-forwarded-host': '127.0.0.1',
      'x-forwarded-proto': 'https',
      'x-forwarded-port': '443',
    },
  });
  const html = await response.text();

  // Without trusting those headers the renderer answers with the empty client-side page.
  expect(html).toContain('<html lang="pt-BR"');
  expect(html).toContain('ng-server-context="ssr"');
});

test('answers the BFF routes under /api', async ({ request }) => {
  const health = await request.get(`${origin}/api/health`);
  expect(health.status()).toBe(200);
  expect(await health.json()).toEqual({ status: 'ok', spotify: 'missing_credentials' });

  const tracks = await request.get(`${origin}/api/tracks?isrc=BR1SP1200071`);
  expect(tracks.status()).toBe(503);
  expect((await tracks.json()).code).toBe('integration_unavailable');

  const unknown = await request.get(`${origin}/api/nothing-here`);
  expect(unknown.status()).toBe(404);
  expect((await unknown.json()).code).toBe('not_found');
});

test('serves the static files that the build puts next to the server', async ({ request }) => {
  const html = await (await request.get(`${origin}/`)).text();
  const script = /<script[^>]*\ssrc="([^"]*\.js)"/.exec(html)?.[1];
  expect(script, 'the page links to a script').toBeDefined();

  const asset = await request.get(`${origin}/${script!.replace(/^\//, '')}`);

  expect(asset.status()).toBe(200);
  expect(asset.headers()['content-type']).toContain('javascript');
});

test('keeps the security headers on the pages it renders', async ({ request }) => {
  const headers = (await request.get(`${origin}/`)).headers();

  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['x-powered-by']).toBeUndefined();
});
