import { expect, Page, test } from '@playwright/test';
import { isolateSpotify, mockTracks } from './support/mock-api';
import { openLoaded } from './support/ui';

/** The sections of a card, from top to bottom, that must start at the same height in every card of a row. */
const SECTIONS = [
  'h2',
  '.card__artists',
  '.card__meta',
  '.card__isrc',
  'orp-track-player',
  '.card__link',
];

interface Band {
  readonly cards: number;
  /** For each section: the distinct `top` values found across the cards of the row. */
  readonly distinct: Record<string, number[]>;
  readonly heights: number[];
}

/** Groups the cards by row (same top) and reports where each section starts in each card. */
async function measureBands(page: Page): Promise<Band[]> {
  return page.locator('orp-track-card .card').evaluateAll((cards, sections) => {
    const top = (element: Element) => Math.round(element.getBoundingClientRect().top + scrollY);
    const bands = new Map<number, Element[]>();
    for (const card of cards) {
      const key = top(card);
      bands.set(key, [...(bands.get(key) ?? []), card]);
    }
    return [...bands.values()].map((row) => ({
      cards: row.length,
      distinct: Object.fromEntries(
        sections.map((selector) => [
          selector,
          [...new Set(row.map((card) => top(card.querySelector(selector) as Element)))],
        ]),
      ),
      heights: [...new Set(row.map((card) => Math.round(card.getBoundingClientRect().height)))],
    }));
  }, SECTIONS);
}

test.beforeEach(async ({ page }) => {
  await isolateSpotify(page);
  await mockTracks(page);
  await openLoaded(page);
});

test('every section starts at the same height in all the cards of a row', async ({ page }) => {
  const bands = await measureBands(page);

  expect(bands.length).toBeGreaterThan(0);
  for (const band of bands) {
    for (const [section, tops] of Object.entries(band.distinct)) {
      expect(tops, `${section} in a row of ${band.cards} cards`).toHaveLength(1);
    }
    expect(band.heights).toHaveLength(1);
  }
});

test('the cards really differ in content, so the alignment is doing real work', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'One column: every card is a row of its own');
  // "Louca" has three artists and a date that wraps; "Repente" has one artist: without subgrid their
  // sections would start at different heights.
  const heights = await page
    .locator('orp-track-card .card__artists')
    .evaluateAll((artists) =>
      artists.map((element) => Math.round(element.getBoundingClientRect().height)),
    );

  expect(new Set(heights).size).toBeGreaterThan(1);
});

test('opening a player changes nothing in the cards: the player lives in the bar', async ({
  page,
}) => {
  const before = await measureBands(page);

  await page.getByRole('button', { name: 'Listen to a preview' }).first().click();
  await expect(page.locator('iframe')).toHaveCount(1);

  // The click leaves the pointer over the card, which rises by 2px (a short transition) while it is hovered:
  // take the pointer away and measure until the card has settled.
  await page.mouse.move(0, 0);
  await expect(async () => expect(await measureBands(page)).toEqual(before)).toPass();
});

test('stays aligned in another language, where texts wrap differently', async ({ page }) => {
  await page.locator('orp-language-select [role="combobox"]').click();
  await page.getByRole('option', { name: 'Русский' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Отсутствующие ISRC');

  for (const band of await measureBands(page)) {
    for (const [section, tops] of Object.entries(band.distinct)) {
      expect(tops, `${section} in a row of ${band.cards} cards`).toHaveLength(1);
    }
  }
});
