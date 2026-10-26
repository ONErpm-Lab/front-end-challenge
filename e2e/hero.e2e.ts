import { expect, Page, test } from '@playwright/test';
import { isolateSpotify, mockTracks } from './support/mock-api';

/** The most a color channel may differ between the last row of the hero and the first row of the page. */
const MAX_STEP = 10;

const setTheme = (page: Page, theme: 'light' | 'dark') =>
  page.addInitScript((value) => localStorage.setItem('orp.theme', value), theme);

/** Waits for the one-off animations (fade-ins) to finish; the endless ones (the equalizer) never do. */
async function whenAnimationsSettle(page: Page) {
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity)
      .every((animation) => animation.playState !== 'running'),
  );
}

/** The pixels of a PNG, read back in the page (no image library needed): `width`, then RGBA values. */
async function decode(page: Page, png: Buffer) {
  return page.evaluate(async (base64) => {
    const blob = await (await fetch(`data:image/png;base64,${base64}`)).blob();
    const image = await createImageBitmap(blob);
    const canvas = new OffscreenCanvas(image.width, image.height);
    const context = canvas.getContext('2d')!;
    context.drawImage(image, 0, 0);
    return {
      width: image.width,
      height: image.height,
      data: Array.from(context.getImageData(0, 0, image.width, image.height).data),
    };
  }, png.toString('base64'));
}

for (const theme of ['light', 'dark'] as const) {
  test(`the glow of the hero fades out before its edge, in the ${theme} theme`, async ({
    page,
  }) => {
    await isolateSpotify(page);
    await mockTracks(page);
    await setTheme(page, theme);
    await page.goto('/');
    await expect(page.locator('orp-track-card')).toHaveCount(10);
    await whenAnimationsSettle(page); // the page fades in; the colors are read as rendered
    const viewportHeight = page.viewportSize()!.height;

    const hero = (await page.locator('.hero').boundingBox())!;
    const bottom = hero.y + hero.height;
    expect(bottom, 'the end of the hero is on the first screen').toBeLessThan(viewportHeight);
    const top = Math.floor(bottom) - 2;
    const strip = await page.screenshot({
      clip: { x: 0, y: top, width: page.viewportSize()!.width, height: 5 },
      scale: 'css',
    });
    const { width, data } = await decode(page, strip);
    const pixel = (x: number, row: number) => {
      const at = (row * width + x) * 4;
      return [data[at], data[at + 1], data[at + 2]];
    };
    const inside = Math.floor(bottom) - 1 - top;
    const outside = Math.ceil(bottom) + 1 - top;

    for (const share of [0.15, 0.5, 0.85]) {
      const x = Math.floor(width * share);
      const steps = pixel(x, inside).map((value, channel) =>
        Math.abs(value - pixel(x, outside)[channel]),
      );
      expect(Math.max(...steps), `at ${Math.round(share * 100)}% of the width`).toBeLessThanOrEqual(
        MAX_STEP,
      );
    }
  });
}
