import { expect, test } from '@playwright/test';
import { isolateSpotify, mockTracks } from './support/mock-api';
import { chooseLanguage, openLoaded } from './support/ui';

test.beforeEach(async ({ page }) => {
  await isolateSpotify(page);
  await mockTracks(page);
});

test.describe('language', () => {
  test.describe('picked from the browser language', () => {
    test.use({ locale: 'tr-TR' });

    test('a Turkish browser gets the page in Turkish', async ({ page }) => {
      await openLoaded(page);

      await expect(page.getByRole('heading', { level: 1 })).toHaveText("Eksik ISRC'ler");
      await expect(page.locator('html')).toHaveAttribute('lang', 'tr');
    });
  });

  test('can be switched to each of the six languages, updating text, html lang and title', async ({
    page,
  }) => {
    await openLoaded(page);
    const cases = [
      ['Português', 'ISRCs ausentes', 'pt-BR', 'Consulta de ISRC'],
      ['Español', 'ISRC ausentes', 'es', 'Consulta de ISRC'],
      ['Русский', 'Отсутствующие ISRC', 'ru', 'Поиск по ISRC'],
      ['Français', 'ISRC manquants', 'fr', 'Recherche par ISRC'],
      ['Türkçe', "Eksik ISRC'ler", 'tr', 'ISRC sorgusu'],
      ['English', 'Missing ISRCs', 'en', 'ISRC lookup'],
    ] as const;

    for (const [name, heading, lang, tab] of cases) {
      await chooseLanguage(page, name);

      await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading);
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      await expect(page).toHaveTitle(tab);
    }
  });

  test('translates the cards, including the date format, and keeps the same order', async ({
    page,
  }) => {
    await openLoaded(page);
    const before = await page.locator('orp-track-card h2').allTextContents();
    expect(before).toHaveLength(10);

    await chooseLanguage(page, 'Português');

    const card = page.locator('orp-track-card').filter({ hasText: 'Louca' }).first();
    await expect(card).toContainText('4 de outubro de 2019');
    await expect(card.locator('p-tag')).toHaveText('Disponível no Brasil');
    expect(await page.locator('orp-track-card h2').allTextContents()).toEqual(before);
  });

  test('is remembered after a reload', async ({ page }) => {
    await openLoaded(page);
    await chooseLanguage(page, 'Русский');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Отсутствующие ISRC');

    await page.reload();

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Отсутствующие ISRC');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  });
});

test.describe('server-rendered language', () => {
  for (const [header, lang, heading] of [
    ['ru-RU,ru;q=0.9,en;q=0.5', 'ru', 'Отсутствующие ISRC'],
    ['tr', 'tr', "Eksik ISRC'ler"],
    ['pt-PT,pt;q=0.8', 'pt-BR', 'ISRCs ausentes'],
    ['de;q=0, es;q=0.2, fr;q=0.9', 'fr', 'ISRC manquants'],
    ['de-DE', 'en', 'Missing ISRCs'],
    ['', 'en', 'Missing ISRCs'],
  ] as const) {
    test(`Accept-Language "${header}" arrives already in ${lang}, before any JavaScript runs`, async ({
      request,
    }) => {
      const response = await request.get('/', { headers: { 'accept-language': header } });
      const html = await response.text();

      expect(html).toContain(`<html lang="${lang}"`);
      expect(html).toContain(heading);
      expect(response.headers()['vary']).toContain('Accept-Language');
    });
  }

  test('the saved choice (a cookie) wins over Accept-Language, and the response varies on it', async ({
    request,
  }) => {
    const response = await request.get('/', {
      headers: { 'accept-language': 'fr', cookie: 'orp.language=tr' },
    });
    const html = await response.text();

    expect(html).toContain('<html lang="tr"');
    expect(html).toContain("Eksik ISRC'ler");
    expect(response.headers()['vary']).toContain('Cookie');
  });

  test('ignores a cookie that is not a language and follows Accept-Language', async ({
    request,
  }) => {
    const response = await request.get('/', {
      headers: { 'accept-language': 'es', cookie: 'orp.language=klingon' },
    });

    expect(await response.text()).toContain('<html lang="es"');
  });

  test('a language chosen in the page comes back from the server on the next visit', async ({
    page,
  }) => {
    await isolateSpotify(page);
    await mockTracks(page);
    await openLoaded(page);
    await chooseLanguage(page, 'Français');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('ISRC manquants');

    // Same browser context, so the request carries the cookie the page saved: no JavaScript involved.
    const html = await (
      await page.request.get('/', { headers: { 'accept-language': 'en' } })
    ).text();

    expect(html).toContain('<html lang="fr"');
    expect(html).toContain('ISRC manquants');
  });
});

test.describe('theme', () => {
  test('toggles to dark and back, and is remembered after a reload', async ({ page }) => {
    await openLoaded(page);
    const html = page.locator('html');
    await expect(html).not.toHaveClass(/app-dark/);

    await page.getByRole('button', { name: 'Switch to the dark theme' }).click();
    await expect(html).toHaveClass(/app-dark/);
    await page.reload();

    await expect(html).toHaveClass(/app-dark/);
    await expect(page.getByRole('button', { name: 'Switch to the light theme' })).toBeVisible();

    await page.getByRole('button', { name: 'Switch to the light theme' }).click();
    await expect(html).not.toHaveClass(/app-dark/);
  });

  test('a saved dark choice is applied before the app boots (no white flash)', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('orp.theme', 'dark'));
    // Without the JavaScript bundles nothing from Angular can run: only the inline script in index.html.
    await page.route('**/*.js', (route) => route.abort());

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('html')).toHaveClass(/app-dark/);
  });

  test.describe('with a dark system preference', () => {
    test.use({ colorScheme: 'dark' });

    test('follows it when nothing was chosen', async ({ page }) => {
      await openLoaded(page);

      await expect(page.locator('html')).toHaveClass(/app-dark/);
    });

    test('yields to a saved light choice', async ({ page }) => {
      await page.addInitScript(() => localStorage.setItem('orp.theme', 'light'));

      await openLoaded(page);

      await expect(page.locator('html')).not.toHaveClass(/app-dark/);
    });
  });
});
