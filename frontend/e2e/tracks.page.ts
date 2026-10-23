import { expect, type Locator, type Page } from '@playwright/test';

/** Page Object: os testes falam a língua da tela, não de seletores. */
export class TracksPage {
  readonly cards: Locator;
  readonly titles: Locator;
  readonly sortButton: Locator;
  readonly alerts: Locator;

  constructor(private readonly page: Page) {
    this.cards = page.locator('app-track-card');
    this.titles = page.locator('app-track-card h2');
    this.sortButton = page.getByRole('button', { name: /Título/ });
    this.alerts = page.locator('app-alert');
  }

  async open(): Promise<void> {
    await this.page.goto('/');
    await expect(
      this.page.getByRole('heading', { level: 1, name: 'Faixas do contrato' }),
    ).toBeVisible();
  }

  async waitForTracks(count = 9): Promise<void> {
    await expect(this.cards).toHaveCount(count);
  }

  /** Espera as animações de entrada terminarem: checagens visuais medem o estado final. */
  async waitForAnimations(): Promise<void> {
    await this.page.waitForFunction(() =>
      document
        .getAnimations()
        .every((a) => a.playState !== 'running' || a.effect?.getTiming().iterations === Infinity),
    );
  }

  card(title: string): Locator {
    return this.cards.filter({ has: this.page.getByRole('heading', { name: title, exact: true }) });
  }

  chip(label: string): Locator {
    return this.page.getByRole('button', { name: new RegExp(label) });
  }

  notFoundCards(): Locator {
    return this.page.locator('app-track-not-found');
  }

  alert(heading: string): Locator {
    return this.alerts.filter({ hasText: heading });
  }

  async titleTexts(): Promise<string[]> {
    return (await this.titles.allInnerTexts()).map((t) => t.trim());
  }
}
