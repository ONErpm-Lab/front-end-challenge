import { expect, test } from '@playwright/test';
import { chooseLanguage } from './support/ui';

/**
 * No mocks here: the server runs without Spotify credentials (see playwright.config.ts), so these
 * tests exercise the real BFF reporting that the integration is unavailable, and what the page
 * does about it.
 */
test.describe('when the Spotify integration is unavailable', () => {
  test('the page alerts the visitor instead of showing an empty list', async ({ page }) => {
    await page.goto('/');

    const alert = page.getByRole('alert');
    await expect(alert).toContainText('Music data unavailable');
    await expect(alert).toContainText('We could not reach Spotify right now');
    await expect(page.locator('orp-track-card')).toHaveCount(0);
    await expect(page.getByRole('main')).toHaveAttribute('tabindex', '-1');
  });

  test('"Try again" asks the server again and keeps the alert while it stays down', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByRole('alert')).toBeVisible();

    const second = page.waitForRequest('**/api/tracks*');
    await page.getByRole('button', { name: 'Try again' }).click();
    await second;

    await expect(page.getByRole('alert')).toBeVisible();
  });

  test('the alert is a centred panel on a wide screen, 30rem wide at most', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    const panel = (await page.getByRole('alert').boundingBox())!;
    const button = (await page.getByRole('button', { name: 'Try again' }).boundingBox())!;

    expect(panel.width).toBeLessThanOrEqual(480 + 1); // 30rem
    expect(Math.abs(panel.x + panel.width / 2 - 1280 / 2)).toBeLessThanOrEqual(1);
    expect(button.width).toBeLessThanOrEqual(16 * 16 + 1); // 16rem
  });

  test('the alert fits a very narrow phone: no sideways scroll, a full-width button', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('/');

    const panel = (await page.getByRole('alert').boundingBox())!;
    const button = (await page.getByRole('button', { name: 'Try again' }).boundingBox())!;
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );

    expect(overflow).toBe(0);
    expect(panel.x).toBeGreaterThanOrEqual(0);
    expect(panel.x + panel.width).toBeLessThanOrEqual(320);
    // The button fills the panel (less its padding), and is tall enough to tap.
    expect(button.width).toBeGreaterThan(panel.width - 80);
    expect(button.height).toBeGreaterThanOrEqual(40);
  });

  test('the alert speaks the visitor language', async ({ page }) => {
    await page.goto('/');
    await chooseLanguage(page, 'Português');

    await expect(page.getByRole('alert')).toContainText('Dados musicais indisponíveis');
    await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible();
  });
});

test.describe('GET /api/tracks (the real BFF)', () => {
  test('answers 503 with a stable code, never leaking configuration, and is never cached', async ({
    request,
  }) => {
    const response = await request.get('/api/tracks?isrc=BR1SP1200071');
    const body = await response.text();

    expect(response.status()).toBe(503);
    expect(JSON.parse(body)).toMatchObject({ code: 'integration_unavailable' });
    expect(body).not.toMatch(/SPOTIFY|secret|credential/i);
    expect(response.headers()['cache-control']).toBe('no-store');
  });

  test('rejects a missing, malformed or oversized ISRC list with 400', async ({ request }) => {
    expect((await request.get('/api/tracks')).status()).toBe(400);

    const malformed = await request.get('/api/tracks?isrc=BR1SP1200071,NOPE');
    expect(malformed.status()).toBe(400);
    expect(await malformed.json()).toMatchObject({ code: 'invalid_isrc', invalid: ['NOPE'] });

    const many = Array.from({ length: 21 }, (_, i) => `BR1SP12${String(i).padStart(5, '0')}`).join(
      ',',
    );
    const oversized = await request.get(`/api/tracks?isrc=${many}`);
    expect(oversized.status()).toBe(400);
    expect(await oversized.json()).toMatchObject({ code: 'too_many_isrcs' });
  });

  test('answers JSON 404 for unknown API routes instead of the HTML page', async ({ request }) => {
    const response = await request.get('/api/nope');

    expect(response.status()).toBe(404);
    expect(response.headers()['content-type']).toContain('application/json');
  });
});
