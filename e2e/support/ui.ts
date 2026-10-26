import { expect, Page } from '@playwright/test';

/**
 * Opens the app and waits until it is interactive. The cards only appear after Angular booted,
 * hydrated and fetched, so clicking earlier would race the hydration of the controls.
 */
export async function openLoaded(page: Page) {
  await page.goto('/');
  await expect(page.locator('orp-track-card')).toHaveCount(10);
}

/** Picks a language like a visitor: opens the list, clicks the name, waits for the list to close. */
export async function chooseLanguage(page: Page, name: string) {
  await page.locator('orp-language-select [role="combobox"]').click();
  await page.getByRole('option', { name }).click();
  // The next click must not land while the previous list is still animating closed.
  await expect(page.getByRole('listbox')).toHaveCount(0);
}
