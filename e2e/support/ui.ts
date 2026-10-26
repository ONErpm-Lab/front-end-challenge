import { expect, Page } from '@playwright/test';

/** Opens the app and waits until the table has its rows (Angular booted and the lookup answered). */
export async function openLoaded(page: Page, rows = 10) {
  await page.goto('/');
  await expect(page.locator('orp-tracks-table tbody tr .track__title')).toHaveCount(rows);
}

/** Whether this test runs in the phone project (the detail opens in a sheet there). */
export const isPhone = (page: Page) => (page.viewportSize()?.width ?? 1024) < 1024;

/** Picks a language like a visitor: opens the menu and clicks the name. */
export async function chooseLanguage(page: Page, name: string) {
  await page.locator('orp-language-menu button').first().click();
  await page.getByRole('menuitemradio', { name }).click();
  await expect(page.getByRole('menu')).toHaveCount(0);
}
