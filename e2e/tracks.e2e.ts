import { expect, test } from '@playwright/test';
import { challengeResults, failed, isolateSpotify, mockTracks, notFound } from './support/mock-api';
import { chooseLanguage } from './support/ui';

const EXPECTED_ORDER = [
  'É pra Você',
  'IRON MAIDEN',
  'Louca',
  'Quase Nua',
  'Quem Diria',
  'Repente',
  'Run It Back (Iron Maiden)',
  'Sexta Sua Linda',
  'Доверюсь солнцу',
  'Нам не нравится',
];

test.describe('the page with the 10 tracks of the challenge', () => {
  test.beforeEach(async ({ page }) => {
    await isolateSpotify(page);
    await mockTracks(page);
    await page.goto('/');
  });

  test('lists all 10 tracks ordered by title, A to Z', async ({ page }) => {
    const titles = page.locator('orp-track-card h2');

    await expect(titles).toHaveCount(10);
    expect(await titles.allTextContents()).toEqual(EXPECTED_ORDER);
  });

  test('shows every piece of data the card must have', async ({ page }) => {
    const card = page.locator('orp-track-card').filter({ hasText: 'Louca' }).first();

    await expect(card.getByRole('img', { name: 'Cover of the album Louca' })).toBeVisible();
    await expect(card.getByRole('heading', { level: 2, name: 'Louca' })).toBeVisible();
    await expect(card.locator('.card__artists')).toHaveText('DJ Malibu, MC Pack, MC Gui Andrade');
    await expect(card.locator('dl')).toContainText('Released');
    await expect(card.locator('dl')).toContainText('October 4, 2019');
    await expect(card.locator('dl')).toContainText('02:04');
    await expect(card.locator('dl')).toContainText('BXKZM1900345');
    await expect(card.locator('p-tag')).toHaveText('Available in Brazil');
    await expect(card.getByRole('button', { name: 'Listen to a preview' })).toBeVisible();
    await expect(card.getByRole('link', { name: /Open on Spotify/ })).toHaveAttribute(
      'href',
      'https://open.spotify.com/track/1Esxp6lXJWU7TaOQM2JsQn',
    );
  });

  test('every duration is mm:ss and every card says whether it is available in Brazil', async ({
    page,
  }) => {
    const cards = page.locator('orp-track-card');
    // The cards appear after the lookup: wait for all of them, or the loop below could check nothing.
    await expect(cards).toHaveCount(10);

    for (let index = 0; index < 10; index++) {
      const card = cards.nth(index);
      await expect(card.locator('dd').nth(1)).toHaveText(/^\d{2}:\d{2}$/);
      await expect(card.locator('p-tag')).toHaveText(/Available in Brazil/);
    }
  });

  test('links to Spotify open in a new tab, safely', async ({ page }) => {
    const links = page.getByRole('link', { name: /Open on Spotify/ });

    await expect(links).toHaveCount(10);
    for (const link of await links.all()) {
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      await expect(link).toHaveAttribute(
        'href',
        /^https:\/\/open\.spotify\.com\/track\/[A-Za-z0-9]{22}$/,
      );
    }
  });

  test('loads a Spotify player only for the track the visitor wants to hear', async ({ page }) => {
    await expect(page.locator('iframe')).toHaveCount(0);

    await page.getByRole('button', { name: 'Listen to a preview' }).first().click();

    const player = page.locator('iframe');
    await expect(player).toHaveCount(1);
    await expect(player).toHaveAttribute(
      'src',
      /^https:\/\/open\.spotify\.com\/embed\/track\/[A-Za-z0-9]{22}/,
    );
    await expect(player).toHaveAttribute('title', /Spotify player for /);
    await expect(page.getByRole('button', { name: 'Listen to a preview' })).toHaveCount(9);
    await expect(page.getByRole('button', { name: 'Now playing' })).toHaveCount(1);
  });
});

test.describe('ISRCs that did not become a track', () => {
  test('are listed with their own card, and a warning says how many failed', async ({ page }) => {
    await isolateSpotify(page);
    await mockTracks(page, [
      ...challengeResults().slice(0, 2),
      notFound('XX1AA0000001'),
      failed('XX1AA0000002'),
      failed('XX1AA0000003'),
    ]);

    await page.goto('/');

    await expect(page.locator('orp-track-card')).toHaveCount(2);
    await expect(page.locator('orp-isrc-card')).toHaveCount(3);
    await expect(page.getByText('ISRC not found on Spotify')).toBeVisible();
    await expect(page.getByText('Could not load this ISRC')).toHaveCount(2);
    await expect(page.getByRole('status').filter({ hasText: 'ISRCs affected: 2' })).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test.describe('the list of affected ISRCs', () => {
    /** More ISRCs than fit on the screen: the list must not depend on finding them among the cards. */
    const MANY = Array.from({ length: 40 }, (_, index) =>
      failed(`XX1AA${String(index).padStart(7, '0')}`),
    );

    test.beforeEach(async ({ page }) => {
      await isolateSpotify(page);
      await mockTracks(page, [...challengeResults().slice(0, 2), ...MANY]);
      await page.goto('/');
      await expect(page.locator('orp-track-card')).toHaveCount(2);
    });

    test('opens from the warning, listing every ISRC that failed, and keeps the warning clear of the cards', async ({
      page,
    }) => {
      await expect(
        page.getByRole('status').filter({ hasText: 'ISRCs affected: 40' }),
      ).toBeVisible();
      const warning = await page.locator('p-message').boundingBox();
      const firstCard = await page.locator('orp-track-card .card').first().boundingBox();
      expect(
        (firstCard?.y ?? 0) - ((warning?.y ?? 0) + (warning?.height ?? 0)),
      ).toBeGreaterThanOrEqual(16);

      await page.getByRole('button', { name: 'Show affected ISRCs' }).click();

      const dialog = page.getByRole('dialog', { name: 'ISRCs that could not be loaded' });
      await expect(dialog).toBeVisible();
      await expect(dialog.locator('.affected__isrc')).toHaveCount(40);
      await expect(dialog.locator('.affected__isrc').first()).toHaveText('XX1AA0000000');
    });

    test('scrolls inside the dialog, which stays within the screen', async ({ page }) => {
      await page.getByRole('button', { name: 'Show affected ISRCs' }).click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      const box = await dialog.boundingBox();
      const viewport = page.viewportSize()!;
      expect(box!.y).toBeGreaterThanOrEqual(0);
      expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);
      expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
      const list = dialog.getByLabel('Affected ISRCs');
      expect(await list.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
    });

    test('closes with Escape and gives the focus back to the button that opened it', async ({
      page,
    }) => {
      const trigger = page.getByRole('button', { name: 'Show affected ISRCs' });
      await trigger.click();
      await expect(page.getByRole('dialog')).toBeVisible();

      await page.keyboard.press('Escape');

      await expect(page.getByRole('dialog')).toHaveCount(0);
      await expect(trigger).toBeFocused();
    });

    test('is in the visitor language', async ({ page }) => {
      await chooseLanguage(page, 'Português');

      await page.getByRole('button', { name: 'Ver ISRCs afetados' }).click();

      await expect(
        page.getByRole('dialog', { name: 'ISRCs que não puderam ser carregados' }),
      ).toBeVisible();
      await expect(page.getByRole('button', { name: 'Fechar' })).toBeVisible();
    });
  });

  test('come after the tracks, whatever their ISRC', async ({ page }) => {
    await isolateSpotify(page);
    await mockTracks(page, [
      failed('AA1AA0000001'),
      notFound('AA1AA0000002'),
      ...challengeResults().slice(0, 1),
    ]);

    await page.goto('/');
    await expect(page.locator('orp-isrc-card')).toHaveCount(2);

    const kinds = await page
      .locator('main li > *')
      .evaluateAll((nodes) => nodes.map((node) => node.tagName.toLowerCase()));
    expect(kinds).toEqual(['orp-track-card', 'orp-isrc-card', 'orp-isrc-card']);
  });
});

test.describe('the provider recovers', () => {
  test('a failed lookup turns into the list when the visitor tries again', async ({ page }) => {
    await isolateSpotify(page);
    let calls = 0;
    await page.route('**/api/tracks*', (route) => {
      calls++;
      return calls === 1
        ? route.fulfill({ status: 503, json: { code: 'integration_unavailable', message: 'down' } })
        : route.fulfill({ json: { results: challengeResults() } });
    });

    await page.goto('/');
    await expect(page.getByRole('alert')).toContainText('Music data unavailable');
    await expect(page.locator('orp-track-card')).toHaveCount(0);

    await page.getByRole('button', { name: 'Try again' }).click();

    await expect(page.locator('orp-track-card')).toHaveCount(10);
    await expect(page.getByRole('alert')).toHaveCount(0);
  });
});
