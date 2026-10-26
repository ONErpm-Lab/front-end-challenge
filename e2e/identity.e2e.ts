import { expect, Page, test } from '@playwright/test';
import { isolateSpotify, mockTracks } from './support/mock-api';
import { chooseLanguage, openLoaded } from './support/ui';

test.beforeEach(async ({ page }) => {
  await isolateSpotify(page);
  await mockTracks(page);
});

test.describe('footer', () => {
  test('credits the author and what it was built for, at the bottom of the page', async ({
    page,
  }) => {
    await openLoaded(page);

    const footer = page.getByRole('contentinfo');
    await footer.scrollIntoViewIfNeeded();

    await expect(footer).toBeVisible();
    await expect(footer).toContainText('Alysson Mascarenhas');
    await expect(footer).toContainText('Developed for the ONErpm front-end technical challenge.');
    await expect(footer).toContainText('Track data from the Spotify Web API.');
  });

  test('links to the author portfolio and to the source code, opening in a new tab', async ({
    page,
  }) => {
    await openLoaded(page);

    const author = page.getByRole('link', { name: /Alysson Mascarenhas/ });
    const source = page.getByRole('link', { name: /Source code/ });

    await expect(author).toHaveAttribute('href', 'https://alyssonmascarenhas.github.io/portfolio/');
    await expect(source).toHaveAttribute(
      'href',
      'https://github.com/AlyssonMascarenhas/onerpm-challenge',
    );
    for (const link of [author, source]) {
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });

  test('is translated with the page', async ({ page }) => {
    await openLoaded(page);

    await chooseLanguage(page, 'Português');

    await expect(page.getByRole('contentinfo')).toContainText(
      'Desenvolvido para o desafio técnico de front-end da ONErpm.',
    );
    await expect(page.getByRole('contentinfo')).toContainText('Alysson Mascarenhas');
  });

  test('is the last thing on the page, even when there is little content', async ({ page }) => {
    await page.route('**/api/tracks*', (route) => route.fulfill({ json: { results: [] } }));
    await page.goto('/');
    await expect(page.getByRole('contentinfo')).toBeVisible();

    // The layout settles after hydration and the first paint: poll instead of measuring once.
    await expect
      .poll(() =>
        page.evaluate(() => ({
          footerBottom: Math.round(
            document.querySelector('footer')!.getBoundingClientRect().bottom,
          ),
          viewportHeight: innerHeight,
        })),
      )
      .toEqual(
        await page.evaluate(() => ({ footerBottom: innerHeight, viewportHeight: innerHeight })),
      );
  });
});

test.describe('tab identity', () => {
  test('the tab shows the product name, in the language of the page', async ({ page }) => {
    await openLoaded(page);
    await expect(page).toHaveTitle('ISRC lookup');

    await chooseLanguage(page, 'Português');

    await expect(page).toHaveTitle('Consulta de ISRC');
  });

  test('the icon is the equalizer mark of the header, served as SVG with ICO and touch fallbacks', async ({
    page,
    request,
  }) => {
    await openLoaded(page);

    const icons = await page
      .locator('link[rel~="icon"], link[rel="apple-touch-icon"]')
      .evaluateAll((links) =>
        links.map((link) => ({
          rel: link.getAttribute('rel'),
          type: link.getAttribute('type'),
          href: link.getAttribute('href'),
        })),
      );
    expect(icons).toEqual([
      { rel: 'icon', type: 'image/svg+xml', href: 'favicon.svg' },
      { rel: 'icon', type: null, href: 'favicon.ico' },
      { rel: 'apple-touch-icon', type: null, href: 'apple-touch-icon.png' },
    ]);

    for (const [file, contentType] of [
      ['favicon.svg', 'image/svg+xml'],
      ['favicon.ico', /image\/(x-icon|vnd\.microsoft\.icon)/],
      ['apple-touch-icon.png', 'image/png'],
    ] as const) {
      const response = await request.get(`/${file}`);
      expect(response.status(), file).toBe(200);
      expect(response.headers()['content-type'], file).toMatch(contentType);
    }

    const svg = await (await request.get('/favicon.svg')).text();
    expect((svg.match(/<rect/g) ?? []).length).toBe(
      await page.locator('orp-app-header svg.brand__mark rect').count(),
    );
  });
});

test.describe('Spotify link', () => {
  const colors = (page: Page) =>
    page
      .locator('.card__link .action')
      .first()
      .evaluate((link) => {
        const style = getComputedStyle(link);
        return {
          background: style.backgroundColor,
          color: style.color,
          width: Math.round(link.getBoundingClientRect().width),
          previewWidth: Math.round(
            link
              .closest('.card__body')!
              .querySelector('orp-track-player .action')!
              .getBoundingClientRect().width,
          ),
        };
      });

  test('is a black button on the light theme, as wide as the preview button', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await openLoaded(page);

    const badge = await colors(page);

    expect(badge.background).toBe('rgb(18, 18, 18)');
    expect(badge.color).toBe('rgb(255, 255, 255)');
    expect(badge.width).toBe(badge.previewWidth);
  });

  test('turns into a white button on the dark theme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await openLoaded(page);

    const badge = await colors(page);

    expect(badge.background).toBe('rgb(255, 255, 255)');
    expect(badge.color).toBe('rgb(18, 18, 18)');
    expect(badge.width).toBe(badge.previewWidth);
  });
});
