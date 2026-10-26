import { expect, Page, test } from '@playwright/test';
import { isolateSpotify, mockTracks } from './support/mock-api';

/** The height of the sticky header, with some margin: what a card cannot use of a phone screen. */
const HEADER_ALLOWANCE = 80;

test.beforeEach(async ({ page }) => {
  await isolateSpotify(page);
  await mockTracks(page);
  await page.goto('/');
  await expect(page.locator('orp-track-card')).toHaveCount(10);
});

test('never scrolls horizontally, at any width the project covers', async ({ page }) => {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );

  expect(overflow).toBeLessThanOrEqual(0);
});

test('cards fit inside the viewport and are never cut off', async ({ page }) => {
  const viewport = page.viewportSize()!;

  // `orp-track-card` is `display: contents` (its article takes part in the page grid): measure the article.
  for (const card of await page.locator('orp-track-card .card').all()) {
    const box = (await card.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
  }
});

const columnsOnScreen = async (page: Page) => {
  const lefts = await page
    .locator('orp-track-card .card')
    .evaluateAll((cards) => cards.map((card) => Math.round(card.getBoundingClientRect().left)));
  return new Set(lefts).size;
};

test('lays the cards out in as many columns as fit', async ({ page }, testInfo) => {
  expect(await columnsOnScreen(page)).toBe(testInfo.project.name === 'mobile' ? 1 : 4);
});

test.describe('columns by width', () => {
  for (const [width, columns] of [
    [375, 1],
    [640, 2],
    [960, 3],
    [1280, 4],
    [1600, 4],
  ] as const) {
    test(`${width}px wide: ${columns} column(s)`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });

      await expect.poll(() => columnsOnScreen(page)).toBe(columns);
    });
  }
});

test.describe('the facts of a card', () => {
  for (const width of [375, 640, 960, 1280, 1440, 1600]) {
    test(`${width}px wide: no ISRC is broken in two lines or cut off`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });

      await expect
        .poll(() =>
          page.locator('orp-track-card .card__isrc').evaluateAll((codes) =>
            codes.map((code) => ({
              broken:
                code.getBoundingClientRect().height >
                1.6 * parseFloat(getComputedStyle(code).lineHeight),
              cut: code.scrollWidth > code.clientWidth,
            })),
          ),
        )
        .toEqual(Array.from({ length: 10 }, () => ({ broken: false, cut: false })));
    });
  }
});

test('on a phone the whole card fits on the screen, with no scrolling to read it', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'The compact card is the phone layout');
  const viewport = page.viewportSize()!;
  const card = page.locator('orp-track-card .card').first();
  await card.scrollIntoViewIfNeeded();

  const box = (await card.boundingBox())!;

  // The sticky header (about 65px) takes the top of the screen; the card must fit in what is left.
  expect(box.height).toBeLessThan(viewport.height - HEADER_ALLOWANCE);
  await expect(card.getByRole('button', { name: 'Listen to a preview' })).toBeVisible();
  await expect(card.getByRole('link', { name: 'Open on Spotify' })).toBeVisible();
});

test('on a phone the cover is a small thumbnail beside the title', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'The compact card is the phone layout');
  const card = page.locator('orp-track-card .card').first();

  const cover = (await card.locator('.card__cover').boundingBox())!;
  const title = (await card.getByRole('heading', { level: 2 }).boundingBox())!;

  expect(cover.width).toBeLessThan(120);
  expect(title.x).toBeGreaterThanOrEqual(cover.x + cover.width);
});

test('cards of the same row have the same height', async ({ page }) => {
  const rows = await page.locator('orp-track-card').evaluateAll((cards) => {
    const byTop = new Map<number, number[]>();
    for (const card of cards) {
      const { top, height } = card.getBoundingClientRect();
      const key = Math.round(top + window.scrollY);
      byTop.set(key, [...(byTop.get(key) ?? []), Math.round(height)]);
    }
    return [...byTop.values()];
  });

  for (const heights of rows) {
    expect(new Set(heights).size).toBe(1);
  }
});

test('the header stays reachable while scrolling', async ({ page }) => {
  await page.mouse.wheel(0, 2000);

  await expect(page.getByRole('combobox', { name: 'Language' })).toBeInViewport();
  await expect(page.getByRole('button', { name: /Switch to the dark theme/ })).toBeInViewport();
});

test('nothing steals the focus on load, so the first Tab reaches the skip link', async ({
  page,
}) => {
  expect(await page.evaluate(() => document.activeElement?.tagName)).toBe('BODY');
  expect(await page.locator('[autofocus]').count()).toBe(0);
});

test('the skip link is the first thing a keyboard user reaches and jumps to the content', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Keyboard navigation is a desktop concern');

  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to content' });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();

  await page.keyboard.press('Enter');

  await expect(page.getByRole('main')).toBeFocused();
});

test('the language list works with the keyboard alone', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Keyboard navigation is a desktop concern');

  await page.getByRole('combobox', { name: 'Language' }).focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('ISRCs ausentes');
});

test.describe('with reduced motion requested', () => {
  test.use({ reducedMotion: 'reduce' });

  test('the logo stops animating', async ({ page }) => {
    const name = await page
      .locator('.bar--1')
      .evaluate((bar) => getComputedStyle(bar).animationName);

    expect(name).toBe('none');
  });
});
