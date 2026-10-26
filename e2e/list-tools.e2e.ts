import { expect, Page, test } from '@playwright/test';
import { challengeResults, failed, isolateSpotify, mockTracks, notFound } from './support/mock-api';
import { chooseLanguage } from './support/ui';

const FILTER = { name: 'Filter by track name or ISRC' };

const filterInput = (page: Page) => page.getByRole('textbox', FILTER);
const summary = (page: Page) => page.locator('.toolbar__summary');
/** What is on the clipboard; Windows writes line breaks as CRLF, which is how it is meant to be pasted there. */
const clipboard = async (page: Page) =>
  (await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, '\n');

/** Ten tracks, plus ISRCs Spotify does not know and one that failed. */
async function openWithMissing(page: Page, missing = 3) {
  await isolateSpotify(page);
  await mockTracks(page, [
    ...challengeResults(),
    ...Array.from({ length: missing }, (_, index) =>
      notFound(`XX1AA${String(index + 1).padStart(7, '0')}`),
    ),
    failed('XX9ZZ0000001'),
  ]);
  await page.goto('/');
  await expect(page.locator('orp-track-card')).toHaveCount(10);
}

test.beforeEach(async ({ context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
});

test.describe('filter', () => {
  test.beforeEach(async ({ page }) => {
    await openWithMissing(page);
  });

  test('is a labelled search field in a search landmark, empty at first', async ({ page }) => {
    await expect(page.getByRole('search')).toBeVisible();
    await expect(filterInput(page)).toHaveValue('');
    await expect(filterInput(page)).toHaveAttribute('placeholder', 'Track name or ISRC');
    await expect(summary(page)).toHaveText('Tracks on Spotify: 10');
  });

  test('keeps the tracks whose title contains what is typed, and says how many', async ({
    page,
  }) => {
    await filterInput(page).fill('louc');

    await expect(page.locator('orp-track-card')).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 2, name: 'Louca' })).toBeVisible();
    await expect(page.locator('orp-isrc-card')).toHaveCount(0);
    await expect(summary(page)).toHaveText('Showing 1 of 14');
  });

  test('ignores case and accents', async ({ page }) => {
    await filterInput(page).fill('E PRA VOCE');

    await expect(page.locator('orp-track-card')).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 2, name: 'É pra Você' })).toBeVisible();
  });

  test('finds a track by its ISRC, even typed with a dash or in small letters', async ({
    page,
  }) => {
    await filterInput(page).fill('br1sp-1200071');

    await expect(page.locator('orp-track-card')).toHaveCount(1);
    await expect(page.locator('orp-track-card .card__isrc').first()).toContainText('BR1SP1200071');
  });

  test('also finds the ISRCs that did not become a track', async ({ page }) => {
    await filterInput(page).fill('XX1AA');

    await expect(page.locator('orp-track-card')).toHaveCount(0);
    await expect(page.locator('orp-isrc-card')).toHaveCount(3);
    await expect(summary(page)).toHaveText('Showing 3 of 14');
  });

  test('says when nothing matches, and offers to clear the filter', async ({ page }) => {
    await filterInput(page).fill('zzzz');

    await expect(page.locator('orp-track-card')).toHaveCount(0);
    await expect(page.locator('.empty')).toContainText('Nothing matches “zzzz”.');

    await page.locator('.empty').getByRole('button', { name: 'Clear the filter' }).click();

    await expect(page.locator('.empty')).toHaveCount(0);
    await expect(page.locator('orp-track-card')).toHaveCount(10);
    await expect(filterInput(page)).toHaveValue('');
  });

  test('is cleared by its own button, or by Escape', async ({ page }) => {
    await filterInput(page).fill('louc');
    await page.getByRole('button', { name: 'Clear the filter' }).click();
    await expect(page.locator('orp-track-card')).toHaveCount(10);
    await expect(page.getByRole('button', { name: 'Clear the filter' })).toHaveCount(0);

    await filterInput(page).fill('louc');
    await filterInput(page).press('Escape');

    await expect(page.locator('orp-track-card')).toHaveCount(10);
    await expect(filterInput(page)).toHaveValue('');
  });

  test('keeps the focus in the field after clearing, so another filter can be typed at once', async ({
    page,
  }) => {
    await filterInput(page).fill('louc');
    await page.getByRole('button', { name: 'Clear the filter' }).click();
    await expect(filterInput(page)).toBeFocused();

    await page.keyboard.type('quase');

    await expect(page.locator('orp-track-card')).toHaveCount(1);

    await filterInput(page).fill('zzzz');
    await page.locator('.empty').getByRole('button', { name: 'Clear the filter' }).click();
    await expect(filterInput(page)).toBeFocused();
  });

  test('does not confuse a title in another alphabet with an ISRC', async ({ page }) => {
    await filterInput(page).fill('Песня 1');

    await expect(page.locator('orp-track-card')).toHaveCount(0);
    await expect(page.locator('orp-isrc-card')).toHaveCount(0);
  });

  test('keeps the order of the list', async ({ page }) => {
    await filterInput(page).fill('a');

    const titles = await page.locator('orp-track-card h2').allTextContents();
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b, 'en')));
  });

  test('does not stop the cards from lining up', async ({ page }) => {
    await filterInput(page).fill('o');

    const tops = await page
      .locator('orp-track-card .card__link')
      .evaluateAll((links) => [
        ...new Set(links.map((l) => Math.round(l.getBoundingClientRect().top))),
      ]);
    const cards = await page.locator('orp-track-card .card').count();
    expect(tops.length).toBeLessThanOrEqual(cards);
  });

  test('is in the visitor language', async ({ page }) => {
    await chooseLanguage(page, 'Português');

    await expect(
      page.getByRole('textbox', { name: 'Filtrar por nome da música ou ISRC' }),
    ).toBeVisible();
    await expect(summary(page)).toHaveText('Faixas no Spotify: 10');
  });
});

test.describe('order and summary', () => {
  test.beforeEach(async ({ page }) => {
    await openWithMissing(page);
  });

  const titles = (page: Page) => page.locator('orp-track-card h2').allTextContents();

  test('the tracks start from A to Z, and one button reverses them to Z to A and back', async ({
    page,
  }) => {
    const button = page.getByRole('button', { name: 'Title A–Z' });
    const ascending = await titles(page);
    expect(ascending).toHaveLength(10);

    await button.click();

    await expect(page.getByRole('button', { name: 'Title Z–A' })).toBeVisible();
    await expect.poll(() => titles(page)).toEqual([...ascending].reverse());
    await expect(page.locator('orp-isrc-card').first()).toBeVisible();

    await page.getByRole('button', { name: 'Title Z–A' }).click();

    await expect.poll(() => titles(page)).toEqual(ascending);
  });

  test('keeps the ISRCs without a track after the tracks, in either order', async ({ page }) => {
    await page.getByRole('button', { name: 'Title A–Z' }).click();

    const kinds = await page
      .locator('main li > *')
      .evaluateAll((nodes) => nodes.map((node) => node.tagName.toLowerCase()));
    expect(kinds.slice(0, 10).every((kind) => kind === 'orp-track-card')).toBe(true);
    expect(kinds.slice(10).every((kind) => kind === 'orp-isrc-card')).toBe(true);
  });

  test('works together with the filter', async ({ page }) => {
    await filterInput(page).fill('iron');
    const ascending = await titles(page);
    expect(ascending.length).toBeGreaterThan(1);

    await page.getByRole('button', { name: 'Title A–Z' }).click();

    await expect.poll(() => titles(page)).toEqual([...ascending].reverse());
  });

  test('says how many tracks Spotify has, not counting the ISRCs without one', async ({ page }) => {
    await expect(summary(page)).toHaveText('Tracks on Spotify: 10');
  });

  test('tells screen readers the new order', async ({ page }) => {
    await page.getByRole('button', { name: 'Title A–Z' }).click();

    await expect(
      page.getByRole('status').filter({ hasText: 'Sorted by title, Z to A' }),
    ).toHaveCount(1);
  });

  test('is in the visitor language', async ({ page }) => {
    await chooseLanguage(page, 'Português');

    await expect(page.getByRole('button', { name: 'Título A–Z' })).toBeVisible();
  });
});

test.describe('copy ISRC', () => {
  test.beforeEach(async ({ page }) => {
    await openWithMissing(page);
  });

  test('copies the ISRC of a card and says so', async ({ page }) => {
    const card = page.locator('orp-track-card .card').first();
    const isrc = (await card.locator('.card__isrc').textContent())!.trim();
    const button = card.getByRole('button', { name: `Copy ISRC ${isrc}` });

    await button.click();

    expect(await clipboard(page)).toBe(isrc);
    await expect(card.getByRole('status').filter({ hasText: 'Copied' })).toHaveCount(1);
    await expect(button.locator('i')).toHaveClass(/pi-check/);
  });

  test('goes back to "copy" after a moment', async ({ page }) => {
    const card = page.locator('orp-track-card .card').first();
    const button = card.getByRole('button', { name: /^Copy ISRC / });

    await button.click();

    await expect(button.locator('i')).toHaveClass(/pi-check/);
    await expect(button.locator('i')).toHaveClass(/pi-copy/, { timeout: 4000 });
  });

  test('copies the code of an ISRC that has no track', async ({ page }) => {
    const card = page.locator('orp-isrc-card', { hasText: 'XX1AA0000002' });

    await card.getByRole('button', { name: 'Copy ISRC XX1AA0000002' }).click();

    expect(await clipboard(page)).toBe('XX1AA0000002');
  });

  test('every card has its own button, and the buttons are reachable by keyboard', async ({
    page,
  }) => {
    await expect(page.getByRole('button', { name: /^Copy ISRC / })).toHaveCount(14);
    const first = page.getByRole('button', { name: /^Copy ISRC / }).first();
    await first.focus();
    await page.keyboard.press('Enter');

    await expect(first.locator('i')).toHaveClass(/pi-check/);
  });
});

test.describe('ISRCs not in our database', () => {
  test('are counted next to the filter, and listed in a dialog with a copy button each', async ({
    page,
  }) => {
    await openWithMissing(page);
    const trigger = page.getByRole('button', { name: 'ISRCs not in our database: 3' });
    await expect(trigger).toBeVisible();

    await trigger.click();

    const dialog = page.getByRole('dialog', { name: 'ISRCs not in our database' });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('.affected__isrc')).toHaveText([
      'XX1AA0000001',
      'XX1AA0000002',
      'XX1AA0000003',
    ]);
    await dialog.getByRole('button', { name: 'Copy ISRC XX1AA0000002' }).click();
    expect(await clipboard(page)).toBe('XX1AA0000002');
  });

  test('can all be copied at once, one per line', async ({ page }) => {
    await openWithMissing(page);
    await page.getByRole('button', { name: 'ISRCs not in our database: 3' }).click();

    await page.getByRole('dialog').getByRole('button', { name: 'Copy all' }).click();

    expect(await clipboard(page)).toBe('XX1AA0000001\nXX1AA0000002\nXX1AA0000003');
    await expect(page.getByRole('dialog').getByRole('button', { name: 'Copied' })).toBeVisible();
  });

  test('do not include the ISRC whose lookup failed, which has its own list', async ({ page }) => {
    await openWithMissing(page);
    await page.getByRole('button', { name: 'ISRCs not in our database: 3' }).click();

    await expect(page.getByRole('dialog')).not.toContainText('XX9ZZ0000001');
  });

  test('close with Escape and give the focus back to the button', async ({ page }) => {
    await openWithMissing(page);
    const trigger = page.getByRole('button', { name: 'ISRCs not in our database: 3' });
    await trigger.click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test('a long list scrolls inside the dialog, which stays within the screen', async ({ page }) => {
    await openWithMissing(page, 40);
    await page.getByRole('button', { name: 'ISRCs not in our database: 40' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const box = (await dialog.boundingBox())!;
    const viewport = page.viewportSize()!;
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
    await expect(dialog.locator('.affected__isrc')).toHaveCount(40);
    await dialog.getByRole('button', { name: 'Copy all' }).click();
    expect((await clipboard(page)).split('\n')).toHaveLength(40);
  });

  test('are not offered when every ISRC has a track', async ({ page }) => {
    await isolateSpotify(page);
    await mockTracks(page);
    await page.goto('/');
    await expect(page.locator('orp-track-card')).toHaveCount(10);

    await expect(page.locator('.toolbar__missing')).toHaveCount(0);
    await expect(summary(page)).toHaveText('Tracks on Spotify: 10');
  });

  test('are in the visitor language', async ({ page }) => {
    await openWithMissing(page);
    await chooseLanguage(page, 'Português');

    await page.getByRole('button', { name: 'ISRCs que não constam na nossa base: 3' }).click();

    await expect(
      page.getByRole('dialog', { name: 'ISRCs que não constam na nossa base' }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Copiar todos' })).toBeVisible();
  });
});
