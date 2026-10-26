import AxeBuilder from '@axe-core/playwright';
import { expect, Page, test } from '@playwright/test';
import { challengeResults, failed, isolateSpotify, mockTracks, notFound } from './support/mock-api';

/** WCAG 2.0/2.1 levels A and AA: the bar the project commits to (CLAUDE.md). */
const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

/** Colors are measured as rendered, so let the enter animations (fade-ins) finish first. */
async function whenAnimationsSettle(page: Page) {
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity)
      .every((animation) => animation.playState !== 'running'),
  );
}

async function expectNoViolations(page: Page) {
  await whenAnimationsSettle(page);
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze();

  expect(
    violations.map(({ id, impact, help, nodes }) => ({
      id,
      impact,
      help,
      targets: nodes.map((node) => node.target.join(' ')),
    })),
  ).toEqual([]);
}

const setTheme = (page: Page, theme: 'light' | 'dark') =>
  page.addInitScript((value) => localStorage.setItem('orp.theme', value), theme);
const setLanguage = (page: Page, language: string) =>
  page
    .context()
    .addCookies([{ name: 'orp.language', value: language, domain: 'localhost', path: '/' }]);

test.beforeEach(async ({ page }) => {
  await isolateSpotify(page);
});

for (const theme of ['light', 'dark'] as const) {
  test.describe(`${theme} theme`, () => {
    test('page with the 10 tracks has no WCAG A/AA violations', async ({ page }) => {
      await setTheme(page, theme);
      await mockTracks(page);
      await page.goto('/');
      await expect(page.locator('orp-track-card')).toHaveCount(10);
      await page.waitForLoadState('networkidle');

      await expectNoViolations(page);
    });

    test('loading state', async ({ page }) => {
      await setTheme(page, theme);
      await page.route('**/api/tracks*', () => new Promise(() => undefined)); // never answers
      await page.goto('/');
      await expect(page.locator('p-skeleton').first()).toBeVisible();

      await expectNoViolations(page);
    });

    test('unavailable-integration alert (real BFF, no credentials)', async ({ page }) => {
      await setTheme(page, theme);
      await page.goto('/');
      await expect(page.getByRole('alert')).toBeVisible();

      await expectNoViolations(page);
    });

    test('ISRCs without a track and the partial-failure warning', async ({ page }) => {
      await setTheme(page, theme);
      await mockTracks(page, [
        ...challengeResults().slice(0, 2),
        notFound('XX1AA0000001'),
        failed('XX1AA0000002'),
      ]);
      await page.goto('/');
      await expect(page.locator('orp-isrc-card')).toHaveCount(2);

      await expectNoViolations(page);
    });

    test('with the list of affected ISRCs open', async ({ page }) => {
      await setTheme(page, theme);
      await mockTracks(page, [
        ...challengeResults().slice(0, 2),
        ...Array.from({ length: 30 }, (_, index) =>
          failed(`XX1AA${String(index).padStart(7, '0')}`),
        ),
      ]);
      await page.goto('/');
      await expect(page.locator('orp-track-card')).toHaveCount(2);
      await page.getByRole('button', { name: 'Show affected ISRCs' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      await expectNoViolations(page);
    });

    test('with the list of ISRCs that are not in our database open', async ({ page }) => {
      await setTheme(page, theme);
      await mockTracks(page, [
        ...challengeResults().slice(0, 2),
        notFound('XX1AA0000001'),
        notFound('XX1AA0000002'),
        failed('XX9ZZ0000001'),
      ]);
      await page.goto('/');
      await expect(page.locator('orp-track-card')).toHaveCount(2);
      await page.getByRole('button', { name: 'ISRCs not in our database: 2' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      await expectNoViolations(page);
    });

    test('with a filter that matches nothing', async ({ page }) => {
      await setTheme(page, theme);
      await mockTracks(page);
      await page.goto('/');
      await expect(page.locator('orp-track-card')).toHaveCount(10);
      await page.getByRole('textbox', { name: 'Filter by track name or ISRC' }).fill('zzzz');
      await expect(page.locator('.empty')).toBeVisible();

      await expectNoViolations(page);
    });

    test('with a Spotify player opened', async ({ page }) => {
      await setTheme(page, theme);
      await mockTracks(page);
      await page.goto('/');
      await expect(page.locator('orp-track-card')).toHaveCount(10);
      await page.getByRole('button', { name: 'Listen to a preview' }).first().click();
      await expect(page.locator('iframe')).toHaveCount(1);

      await expectNoViolations(page);
    });

    test('with the language list open', async ({ page, isMobile }) => {
      test.skip(isMobile, 'The overlay is the same on desktop');
      await setTheme(page, theme);
      await mockTracks(page);
      await page.goto('/');
      await expect(page.locator('orp-track-card')).toHaveCount(10);
      await page.getByRole('combobox', { name: 'Language' }).click();
      await expect(page.getByRole('option', { name: 'Русский' })).toBeVisible();

      await expectNoViolations(page);
    });
  });
}

test.describe('every language', () => {
  /** [saved choice, name, expected <html lang>, expected heading]: each case must audit ITS language. */
  for (const [language, label, htmlLang, heading] of [
    ['pt', 'Português', 'pt-BR', 'ISRCs ausentes'],
    ['es', 'Español', 'es', 'ISRC ausentes'],
    ['ru', 'Русский', 'ru', 'Отсутствующие ISRC'],
    ['fr', 'Français', 'fr', 'ISRC manquants'],
    ['tr', 'Türkçe', 'tr', "Eksik ISRC'ler"],
  ] as const) {
    test(`${label}: the page is in ${label} and has no violations`, async ({ page }) => {
      await setLanguage(page, language);
      await mockTracks(page);
      await page.goto('/');
      await expect(page.locator('orp-track-card')).toHaveCount(10);
      await page.waitForLoadState('networkidle');

      // Prove the page really is in this language before auditing it.
      await expect(page.locator('html')).toHaveAttribute('lang', htmlLang);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading);
      await expectNoViolations(page);
    });
  }
});
