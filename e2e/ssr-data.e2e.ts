import { expect, test } from '@playwright/test';
import { isolateSpotify } from './support/mock-api';
// The second server of playwright.config.ts (SSR_PORT): it has the recorded Spotify preloaded, so it can render the tracks.
test.use({ baseURL: 'http://localhost:4301' });

const TITLES = ['Louca', 'Quase Nua', 'Repente', 'Sexta Sua Linda', 'Доверюсь солнцу'];

test.describe('the server renders the tracks', () => {
  test('the first HTML already has the cards, in order, with no script needed', async ({
    request,
  }) => {
    const html = await (await request.get('/')).text();

    const headings = [...html.matchAll(/<h2[^>]*class="card__title"[^>]*>([^<]*)<\/h2>/g)].map(
      (match) => match[1],
    );
    expect(headings).toHaveLength(10);
    expect(headings).toEqual([...headings].sort((a, b) => a.localeCompare(b, 'en')));
    for (const title of TITLES) {
      expect(headings).toContain(title);
    }
    expect(html).toContain('id="ng-state"');
  });

  test('the browser keeps what the server drew: no second lookup and no errors', async ({
    page,
  }) => {
    // The cards carry real cover URLs: keep the CDN out of it, but leave /api/tracks alone (that is the path under test).
    await isolateSpotify(page);
    const lookups: string[] = [];
    const problems: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/tracks')) {
        lookups.push(request.url());
      }
    });
    page.on('pageerror', (error) => problems.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error' || message.type() === 'warning') {
        problems.push(message.text());
      }
    });

    await page.goto('/');
    await expect(page.locator('orp-track-card')).toHaveCount(10);
    // Hydration is done when the page answers to a click (the sort button reverses the list).
    await page.getByRole('button', { name: /A–Z|A-Z/ }).click();
    await expect(page.locator('orp-track-card').first().locator('h2')).not.toHaveText('É pra Você');

    expect(lookups).toEqual([]);
    expect(problems).toEqual([]);
  });
});
