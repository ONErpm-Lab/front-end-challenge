import AxeBuilder from '@axe-core/playwright';
import { expect, Page, test } from '@playwright/test';
import { isolateSpotify, mockSpotify } from './support/mock-api';
import { isPhone, openLoaded } from './support/ui';

/** WCAG 2.0/2.1 levels A and AA: the bar the project commits to. */
const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function expectNoViolations(page: Page) {
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity)
      .every((animation) => animation.playState !== 'running'),
  );
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  expect(
    violations.map(({ id, help, nodes }) => ({
      id,
      help,
      targets: nodes.map((node) => node.target.join(' ')),
    })),
  ).toEqual([]);
}

const setTheme = (page: Page, theme: 'light' | 'dark') =>
  page.addInitScript((value) => localStorage.setItem('orp.theme', value), theme);

test.beforeEach(async ({ page }) => {
  await isolateSpotify(page);
});

for (const theme of ['light', 'dark'] as const) {
  test.describe(`${theme} theme`, () => {
    test('the catalog, with an ISRC not found and one that failed', async ({ page }) => {
      await setTheme(page, theme);
      await mockSpotify(page, { notFound: ['QZNJX2081700'], failing: ['BXKZM1900338'] });
      await openLoaded(page, 8);
      await expectNoViolations(page);
    });

    test('loading', async ({ page }) => {
      await setTheme(page, theme);
      await page.route('**/api/tracks*', () => new Promise(() => undefined));
      await page.goto('/');
      await expect(page.locator('.skeleton').first()).toBeVisible();
      await expectNoViolations(page);
    });

    test('Spotify unavailable', async ({ page }) => {
      await setTheme(page, theme);
      await mockSpotify(page, { refuseCredentials: true });
      await page.goto('/');
      await expect(page.getByRole('alert')).toBeVisible();
      await expectNoViolations(page);
    });

    test('the detail of a track and the language menu', async ({ page }) => {
      await setTheme(page, theme);
      await mockSpotify(page);
      await openLoaded(page);
      await page.getByRole('button', { name: 'Show details of Repente' }).click();
      if (isPhone(page)) {
        await expect(page.getByRole('dialog')).toBeVisible();
      }
      await expectNoViolations(page);

      await page.keyboard.press('Escape');
      await page.getByRole('button', { name: 'Show details of Quem Diria' }).click();
      await page.getByRole('button', { name: '2 dates found' }).click();
      await expect(page.getByRole('dialog', { name: 'Release dates found' })).toBeVisible();
      await expectNoViolations(page);

      await page.keyboard.press('Escape');
      if (isPhone(page)) {
        await page.keyboard.press('Escape');
      }
      await page.locator('orp-language-menu button').first().click();
      await expect(page.getByRole('menu')).toBeVisible();
      await expectNoViolations(page);
    });
  });
}
