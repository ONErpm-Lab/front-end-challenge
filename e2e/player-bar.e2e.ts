import { expect, Page, test } from '@playwright/test';
import { isolateSpotify, mockTracks } from './support/mock-api';
import { chooseLanguage, openLoaded } from './support/ui';

const LISTEN = { name: 'Listen to a preview' };

/** Where the bar sits relative to the window, in pixels from the top. */
const barBox = async (page: Page) => {
  const box = await page.locator('orp-player-bar section').boundingBox();
  expect(box, 'the player bar is on the page').not.toBeNull();
  return box!;
};

test.beforeEach(async ({ page }) => {
  await isolateSpotify(page);
  await mockTracks(page);
  await openLoaded(page);
});

/** What the page asked of Spotify's (fake) iFrame API. */
const spotify = (page: Page) =>
  page.evaluate(
    () =>
      (window as unknown as { __spotify?: Record<string, unknown[] | number> }).__spotify ?? null,
  );

test.describe('player bar', () => {
  test('is not on the page until the visitor asks to listen', async ({ page }) => {
    await expect(page.locator('orp-player-bar section')).toHaveCount(0);
    await expect(page.locator('iframe')).toHaveCount(0);
  });

  test('appears pinned to the bottom of the window and stays there while scrolling', async ({
    page,
  }) => {
    await page.getByRole('button', LISTEN).first().click();
    await expect(page.locator('iframe')).toHaveCount(1);
    const viewport = page.viewportSize()!;

    for (const position of [0, 600, 1800]) {
      await page.evaluate((y) => window.scrollTo(0, y), position);
      await expect(async () => {
        const box = await barBox(page);
        expect(Math.round(box.y + box.height)).toBe(viewport.height);
      }).toPass();
    }
  });

  test('starts the music by itself, for the track of the card that was clicked', async ({
    page,
  }) => {
    await page.getByRole('button', LISTEN).nth(2).click();

    await expect.poll(async () => (await spotify(page))?.['played']).toHaveLength(1);
    const state = (await spotify(page))!;
    const [uri] = state['played'] as string[];
    expect(uri).toMatch(/^spotify:track:[A-Za-z0-9]{22}$/);
    expect(state['created']).toHaveLength(1);
    await expect(page.locator('iframe')).toHaveAttribute('src', new RegExp(uri.split(':')[2]));
  });

  test('swaps the track in the same player and starts that one too', async ({ page }) => {
    await page.getByRole('button', LISTEN).nth(0).click();
    await expect.poll(async () => (await spotify(page))?.['played']).toHaveLength(1);

    await page.getByRole('button', LISTEN).nth(0).click();

    await expect.poll(async () => (await spotify(page))?.['played']).toHaveLength(2);
    const state = (await spotify(page))!;
    expect(state['created']).toHaveLength(1);
    expect(state['loaded']).toHaveLength(1);
    const [first, second] = state['played'] as string[];
    expect(second).not.toBe(first);
    expect(state['loaded']).toEqual([second]);
  });

  test('marks the track playing with an equalizer that moves', async ({ page }) => {
    await page.getByRole('button', LISTEN).first().click();
    const bars = page.getByRole('button', { name: 'Now playing' }).locator('rect.action__bar');

    await expect(bars).toHaveCount(3);
    // Angular scopes the keyframes' name with a prefix: only the name itself is ours.
    await expect(bars.first()).toHaveCSS('animation-name', /equalize$/);
  });

  test('keeps the equalizer still for visitors who ask for less motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.getByRole('button', LISTEN).first().click();

    const bars = page.getByRole('button', { name: 'Now playing' }).locator('rect.action__bar');

    await expect(bars.first()).toHaveCSS('animation-name', 'none');
  });

  test('plays one track at a time: choosing another replaces the player', async ({ page }) => {
    await page.getByRole('button', LISTEN).nth(0).click();
    const first = await page.locator('iframe').getAttribute('src');

    await page.getByRole('button', LISTEN).nth(0).click();

    await expect(page.locator('iframe')).toHaveCount(1);
    expect(await page.locator('iframe').getAttribute('src')).not.toBe(first);
    await expect(page.getByRole('button', { name: 'Now playing' })).toHaveCount(1);
  });

  test('marks the card of the track that is playing', async ({ page }) => {
    await page.getByRole('button', LISTEN).nth(2).click();

    const playing = page.getByRole('button', { name: 'Now playing' });

    await expect(playing).toHaveCount(1);
    await expect(playing).toHaveAttribute('aria-current', 'true');
    const card = page.locator('orp-track-card .card', { has: playing });
    await expect(card.getByRole('heading', { level: 2 })).toBeVisible();
  });

  test('closes from its own button, stopping the player and giving the focus back to the card', async ({
    page,
  }) => {
    const listen = page.getByRole('button', LISTEN).nth(1);
    await listen.click();
    await expect(page.locator('iframe')).toHaveCount(1);

    await page.getByRole('button', { name: 'Close the player' }).click();

    await expect(page.locator('iframe')).toHaveCount(0);
    await expect(page.locator('orp-player-bar section')).toHaveCount(0);
    await expect(page.getByRole('button', LISTEN)).toHaveCount(10);
    await expect(page.getByRole('button', LISTEN).nth(1)).toBeFocused();
    expect((await spotify(page))?.['destroyed']).toBe(1);
  });

  test('never covers the footer: at the end of the page the bar sits below it', async ({
    page,
  }) => {
    await page.getByRole('button', LISTEN).first().click();
    await expect(page.locator('iframe')).toHaveCount(1);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    await expect(async () => {
      const footer = await page.getByRole('contentinfo').boundingBox();
      const bar = await barBox(page);
      expect(Math.round(footer!.y + footer!.height)).toBeLessThanOrEqual(Math.round(bar.y));
    }).toPass();
  });

  test('fits the width of the window, with no sideways scrolling', async ({ page }) => {
    await page.getByRole('button', LISTEN).first().click();
    await expect(page.locator('iframe')).toHaveCount(1);
    const viewport = page.viewportSize()!;

    const box = await barBox(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );

    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
    expect(overflow).toBe(0);
  });

  test('holds the place of the player while it loads: a spinner, and no jump when it arrives', async ({
    page,
  }) => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    await page.route('https://open.spotify.com/**', async (route) => {
      await gate;
      // The script still comes from the fake iFrame API; the player frame is the plain stand-in page.
      if (route.request().url().includes('/iframe-api/')) {
        await route.fallback();
        return;
      }
      await route.fulfill({ contentType: 'text/html', body: '<!doctype html><p>player</p>' });
    });

    await page.getByRole('button', LISTEN).first().click();

    const bar = page.locator('orp-player-bar section');
    await expect(bar.getByRole('status')).toHaveText('Loading the player…');
    const heightWhileLoading = Math.round((await barBox(page)).height);
    expect(Math.round((await bar.locator('.bar__stage').boundingBox())!.height)).toBe(80);

    release();

    await expect(bar.getByRole('status')).toHaveCount(0);
    expect(Math.round((await barBox(page)).height)).toBe(heightWhileLoading);
  });

  test('falls back to the plain embed when Spotify script is blocked', async ({ page }) => {
    await page.route('https://open.spotify.com/embed/iframe-api/v1', (route) => route.abort());

    await page.getByRole('button', LISTEN).first().click();

    const frame = page.locator('orp-player-bar iframe');
    await expect(frame).toHaveCount(1);
    await expect(frame).toHaveAttribute(
      'src',
      /^https:\/\/open\.spotify\.com\/embed\/track\/[A-Za-z0-9]{22}/,
    );
    await expect(page.getByRole('button', { name: 'Close the player' })).toBeVisible();
    // Once the frame has loaded the loading indicator is gone, and the frame is visible.
    await expect(page.locator('orp-player-bar').getByRole('status')).toHaveCount(0);
    await expect(frame).toBeVisible();
    expect(await spotify(page)).toBeNull();
  });

  test.describe('play button over the cover', () => {
    const overlay = (page: Page, index = 0) =>
      page.locator('orp-track-card .card').nth(index).locator('.card__play');

    test('rises when the card is pointed at, and is gone when it is not', async ({
      page,
      isMobile,
    }) => {
      test.skip(isMobile, 'Touch has no pointer to hover with: see the next test');
      await expect(overlay(page)).toHaveCSS('opacity', '0');

      await page.locator('orp-track-card .card').first().hover();

      await expect(overlay(page)).toHaveCSS('opacity', '1');
      await expect(overlay(page)).toHaveCSS('background-color', 'rgb(30, 215, 96)');
    });

    test('is always there where there is no hover (touch)', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'Only touch devices have no hover');

      await expect(overlay(page)).toHaveCSS('opacity', '1');
    });

    test('plays the track of its card, and leaves once that track is the one playing', async ({
      page,
    }) => {
      await page.locator('orp-track-card .card').nth(1).hover();

      await overlay(page, 1).click();

      await expect.poll(async () => (await spotify(page))?.['played']).toHaveLength(1);
      await expect(page.getByRole('button', { name: 'Now playing' })).toHaveCount(1);
      await expect(
        page.locator('orp-track-card .card').nth(1).getByRole('button', { name: 'Now playing' }),
      ).toBeVisible();
      await expect(overlay(page, 1)).toHaveCount(0);
    });

    test('is not a tab stop, and the "listen" button stays the accessible control', async ({
      page,
    }) => {
      await expect(overlay(page)).toHaveAttribute('tabindex', '-1');
      await expect(overlay(page)).toHaveAttribute('aria-hidden', 'true');
      await expect(page.getByRole('button', LISTEN)).toHaveCount(10);
    });
  });

  test('is in the visitor language', async ({ page }) => {
    await chooseLanguage(page, 'Português');

    await page.getByRole('button', { name: 'Ouvir uma prévia' }).first().click();

    await expect(page.getByRole('button', { name: 'Fechar o player' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tocando agora' })).toHaveCount(1);
  });
});
