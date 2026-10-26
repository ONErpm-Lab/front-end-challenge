import { expect, test } from '@playwright/test';
import { isolateSpotify, mockTracks } from './support/mock-api';
import { openLoaded } from './support/ui';

/** The nonce a policy carries, or `undefined`. */
const nonceOf = (policy: string | undefined) => /'nonce-([^']+)'/.exec(policy ?? '')?.[1];

test.describe('Content-Security-Policy of the pages', () => {
  test('allows only the own scripts, the ones with this response nonce and the Spotify player', async ({
    request,
  }) => {
    const response = await request.get('/');
    const policy = response.headers()['content-security-policy'];

    expect(policy).toContain("script-src 'self' 'nonce-" /* the nonce is checked below */);
    expect(policy).toContain('https://open.spotify.com');
    expect(policy).not.toContain("'unsafe-inline'");
    expect(policy).not.toContain("'unsafe-eval'");
    expect(nonceOf(policy)).toBeTruthy();
  });

  test('every inline script of the page carries that nonce, and each response has its own', async ({
    request,
  }) => {
    const first = await request.get('/');
    const second = await request.get('/');
    const nonce = nonceOf(first.headers()['content-security-policy']);
    const html = await first.text();

    const inline = [...html.matchAll(/<script(?![^>]*\ssrc=)([^>]*)>/g)]
      .map((match) => match[1])
      // The state of the page is data, not code: the browser never runs it.
      .filter((attributes) => !attributes.includes('application/json'));
    expect(inline.length).toBeGreaterThan(0);
    for (const attributes of inline) {
      expect(attributes).toContain(`nonce="${nonce}"`);
    }
    expect(nonceOf(second.headers()['content-security-policy'])).not.toBe(nonce);
  });

  test('the fallback shell is never served as a document of its own', async ({ request }) => {
    const response = await request.get('/index.csr.html', { maxRedirects: 0 });

    expect(response.status()).toBe(302);
    expect(response.headers()['location']).toBe('/');
  });

  test('the files and the API keep the base policy, with no script-src', async ({ request }) => {
    const html = await (await request.get('/')).text();
    const script = /<script[^>]*\ssrc="([^"]*\.js)"/.exec(html)?.[1];

    for (const url of [`/${script}`, '/api/health']) {
      const policy = (await request.get(url)).headers()['content-security-policy'];
      expect(policy, url).toContain("object-src 'none'");
      expect(policy, url).not.toContain('script-src');
    }
  });

  test('the page runs with no violation, even playing a track through the Spotify script', async ({
    page,
  }) => {
    const violations: string[] = [];
    await page.addInitScript(() => {
      document.addEventListener('securitypolicyviolation', (event) =>
        (window as unknown as { __violations: string[] }).__violations.push(
          `${event.violatedDirective} ${event.blockedURI}`,
        ),
      );
      (window as unknown as { __violations: string[] }).__violations = [];
    });
    page.on('console', (message) => {
      if (message.type() === 'error' || message.text().includes('Content Security Policy')) {
        violations.push(message.text());
      }
    });
    await isolateSpotify(page);
    await mockTracks(page);

    await openLoaded(page);
    await page
      .locator('orp-track-card')
      .first()
      .getByRole('button', { name: /Listen|Play/ })
      .click();
    await expect(page.locator('orp-player-bar')).toBeVisible();
    // The bar shows at once; the Spotify script and the embed come after. Wait until the music has started.
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as unknown as { __spotify?: { played: string[] } }).__spotify?.played.length,
        ),
      )
      .toBe(1);

    expect(
      await page.evaluate(() => (window as unknown as { __violations: string[] }).__violations),
    ).toEqual([]);
    expect(violations).toEqual([]);
  });

  test('refuses a script that someone injected into the page', async ({ page }) => {
    await isolateSpotify(page);
    await mockTracks(page);
    await openLoaded(page);

    const outcome = await page.evaluate(
      () =>
        new Promise<{ ran: boolean; violated: string | null }>((resolve) => {
          const holder = window as unknown as { __pwned?: boolean };
          document.addEventListener(
            'securitypolicyviolation',
            (event) => resolve({ ran: holder.__pwned === true, violated: event.violatedDirective }),
            { once: true },
          );
          const script = document.createElement('script');
          script.textContent = 'window.__pwned = true';
          document.body.appendChild(script);
          setTimeout(() => resolve({ ran: holder.__pwned === true, violated: null }), 1500);
        }),
    );

    expect(outcome).toEqual({ ran: false, violated: expect.stringContaining('script-src') });
  });
});
