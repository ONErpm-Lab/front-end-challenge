import { expect, test } from '@playwright/test';
import { isolateSpotify, mockTracks } from './support/mock-api';

/** The path of the first script or stylesheet the page links to (Angular writes them without a leading slash). */
function assetPath(html: string, pattern: RegExp): string | undefined {
  const link = pattern.exec(html)?.[1];
  return link ? new URL(link, 'http://page.test/').pathname : undefined;
}

const SCRIPT = /<script[^>]*\ssrc="([^"]*\.js)"/;
const STYLESHEET = /<link[^>]*\shref="([^"]*\.css)"/;

/** The real production server, as a browser meets it: what it says about itself, and how it sends the page. */
test.describe('security headers', () => {
  test('the page does not say which framework serves it', async ({ request }) => {
    const response = await request.get('/');

    expect(response.headers()['x-powered-by']).toBeUndefined();
  });

  test('the page, a script and the API carry the security headers', async ({ request }) => {
    const html = await (await request.get('/')).text();
    const script = assetPath(html, SCRIPT);
    expect(script, 'the page links to a script').toBeDefined();

    for (const url of ['/', script!, '/api/tracks?isrc=BR1SP1200071']) {
      const headers = (await request.get(url)).headers();

      expect(headers['x-content-type-options'], url).toBe('nosniff');
      expect(headers['x-frame-options'], url).toBe('SAMEORIGIN');
      expect(headers['referrer-policy'], url).toBe('strict-origin-when-cross-origin');
      expect(headers['content-security-policy'], url).toContain("frame-ancestors 'self'");
      expect(headers['permissions-policy'], url).toContain('camera=()');
      expect(headers['x-powered-by'], url).toBeUndefined();
    }
  });

  test('HSTS is sent only when the request came over HTTPS', async ({ request }) => {
    const plain = await request.get('/');
    expect(plain.headers()['strict-transport-security']).toBeUndefined();

    const secure = await request.get('/', { headers: { 'X-Forwarded-Proto': 'https' } });
    expect(secure.headers()['strict-transport-security']).toContain('max-age=');
  });

  test('the security headers do not stop the page from working', async ({ page }) => {
    await isolateSpotify(page);
    await mockTracks(page);
    const problems: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') problems.push(message.text());
    });
    page.on('pageerror', (error) => problems.push(error.message));

    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    expect(problems).toEqual([]);
  });
});

test.describe('health', () => {
  test('GET /api/health says the server is up, even with no Spotify credentials', async ({
    request,
  }) => {
    const response = await request.get('/api/health');

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok', spotify: 'missing_credentials' });
    expect(response.headers()['cache-control']).toBe('no-store');
  });
});

test.describe('compression', () => {
  test('the page, the scripts and the styles are sent compressed', async ({ request }) => {
    const html = await request.get('/', { headers: { 'Accept-Encoding': 'gzip' } });
    expect(html.headers()['content-encoding']).toBe('gzip');
    expect(html.headers()['vary']).toContain('Accept-Encoding');

    const page = await html.text();
    for (const pattern of [SCRIPT, STYLESHEET]) {
      const url = assetPath(page, pattern);
      expect(url, String(pattern)).toBeDefined();
      const asset = await request.get(url!, { headers: { 'Accept-Encoding': 'gzip' } });
      expect(asset.headers()['content-encoding'], url).toBe('gzip');
    }
  });

  test('a client that does not ask for compression gets the plain page', async ({ request }) => {
    const response = await request.get('/', { headers: { 'Accept-Encoding': 'identity' } });

    expect(response.headers()['content-encoding']).toBeUndefined();
    expect(await response.text()).toContain('<html');
  });
});
