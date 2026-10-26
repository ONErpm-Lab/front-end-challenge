import { expect, test } from '@playwright/test';
import { isolateSpotify, mockSpotify } from './support/mock-api';
import { chooseLanguage, isPhone, openLoaded } from './support/ui';

const titles = (page: import('@playwright/test').Page) =>
  page.locator('orp-tracks-table tbody tr .track__title').allInnerTexts();

test.beforeEach(async ({ page }) => {
  await isolateSpotify(page);
});

test('lists the ten tracks of the challenge, ordered by title', async ({ page }) => {
  await mockSpotify(page);
  await openLoaded(page);

  expect(await titles(page)).toEqual([
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
  ]);
});

test('sums up the catalog', async ({ page }) => {
  await mockSpotify(page);
  await openLoaded(page);

  const values = page.locator('.kpi__value');
  await expect(values).toHaveText(['10', '10', '10', '32:24']);
});

test('filters by text and by status, and reverses the order', async ({ page }) => {
  await mockSpotify(page, { notFound: ['QZNJX2081700'] });
  await openLoaded(page, 9);

  await page.getByRole('searchbox').fill('iron');
  expect(await titles(page)).toEqual(['IRON MAIDEN', 'Run It Back (Iron Maiden)']);
  await expect(page.locator('orp-tracks-table .count')).toHaveText('Showing 2 of 10');

  await page.getByRole('searchbox').fill('');
  await page.getByRole('button', { name: /Not found/ }).click();
  await expect(page.locator('orp-tracks-table tbody tr')).toHaveCount(1);
  await expect(page.locator('orp-tracks-table tbody tr')).toContainText('QZNJX2081700');

  await page.getByRole('button', { name: /^All/ }).click();
  await page.locator('orp-tracks-toolbar .sort').click();
  await expect(page.locator('orp-tracks-table tbody tr .track__title').first()).toHaveText(
    'Доверюсь солнцу',
  );
});

test('shows the picked track in detail (a panel, or a sheet on phones)', async ({ page }) => {
  await mockSpotify(page);
  await openLoaded(page);

  await page.getByRole('button', { name: 'Show details of Quase Nua' }).click();

  if (isPhone(page)) {
    const sheet = page.getByRole('dialog', { name: 'Quase Nua' });
    await expect(sheet).toBeVisible();
    await expect(sheet).toContainText('BR1SP1500002');
    await page.keyboard.press('Escape');
    await expect(sheet).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Show details of Quase Nua' })).toBeFocused();
  } else {
    const panel = page.getByRole('complementary', { name: 'Track details' });
    await expect(panel.getByRole('heading', { level: 2 })).toHaveText('Quase Nua');
    await expect(panel).toContainText('Clarisse Grova');
    await expect(panel.getByRole('link', { name: /Open on Spotify/ })).toHaveAttribute(
      'href',
      'https://open.spotify.com/track/7u8QESpplZWyZZDsoHeIAX',
    );
  }
});

test('warns when Spotify has two release dates, and lists them on click', async ({ page }) => {
  await mockSpotify(page);
  await openLoaded(page);
  await page.getByRole('button', { name: 'Show details of Quem Diria' }).click();

  const warning = page.getByRole('button', { name: '2 dates found' });
  await warning.click();
  const dates = page.getByRole('dialog', { name: 'Release dates found' });
  await expect(dates.getByRole('listitem')).toHaveText(['May 12, 2014 shown', 'July 28, 2014']);

  await page.keyboard.press('Escape');
  await expect(dates).toHaveCount(0);
  await expect(warning).toBeFocused();
});

test('plays a preview through the Spotify player, started by the click', async ({ page }) => {
  await mockSpotify(page);
  await openLoaded(page);
  await page.getByRole('button', { name: 'Show details of Louca' }).click();

  await page.getByRole('button', { name: /Listen to a preview/ }).click();

  // `__spotify` only exists once the (fake) iFrame API script has run.
  const played = () =>
    page.evaluate(
      () => (window as unknown as { __spotify?: { played: string[] } }).__spotify?.played ?? [],
    );
  await expect.poll(played).toEqual(['spotify:track:1Esxp6lXJWU7TaOQM2JsQn']);
  await page.getByRole('button', { name: "Close Spotify's official player" }).click();
  await expect(page.getByRole('button', { name: /Listen to a preview/ })).toBeVisible();
});

test('warns about ISRCs that failed and lists them', async ({ page }) => {
  await mockSpotify(page, { failing: ['BXKZM1900338'] });
  await openLoaded(page, 9);

  await expect(page.locator('.partial')).toContainText('ISRCs affected: 1');
  await page.getByRole('button', { name: 'Show affected ISRCs' }).click();
  await expect(page.getByRole('dialog')).toContainText('BXKZM1900338');
});

test('says when Spotify cannot be used (credentials refused) and offers a retry', async ({
  page,
}) => {
  await mockSpotify(page, { refuseCredentials: true });
  await page.goto('/');

  await expect(page.getByRole('alert')).toContainText('Music data unavailable');
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
});

test('speaks the chosen language and remembers it', async ({ page }) => {
  await mockSpotify(page);
  await openLoaded(page);

  await chooseLanguage(page, 'Português');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('ISRCs ausentes');
  await expect(page).toHaveTitle('Consulta de ISRC');

  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('ISRCs ausentes');
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
});

test('switches the theme before the first paint on the next visit', async ({ page }) => {
  await mockSpotify(page);
  await openLoaded(page);
  const toggle = page.locator('orp-theme-toggle button');

  const before = await page.locator('html').getAttribute('data-theme');
  await toggle.click();
  const after = before === 'dark' ? 'light' : 'dark';
  await expect(page.locator('html')).toHaveAttribute('data-theme', after);

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', after);
});
