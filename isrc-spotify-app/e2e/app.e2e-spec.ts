import { test, expect } from '@playwright/test';

test.describe('Sistema de Localização E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    await page.waitForSelector('app-language-selector', { timeout: 10000 });
  });

  test('deve carregar com idioma padrão (português)', async ({ page }) => {
    const currentLanguage = await page
      .locator('.language-selector .current-language')
      .textContent();
    expect(currentLanguage).toContain('🇧🇷');

    const welcomeText = await page.locator('h1, .welcome-text').first().textContent();
    expect(welcomeText).toContain('Bem-vindo');
  });

  test('deve permitir mudança de idioma para inglês', async ({ page }) => {
    await page.click('.language-selector .dropdown-toggle');

    await page.click('text=English');

    await page.waitForTimeout(1000);

    const currentLanguage = await page
      .locator('.language-selector .current-language')
      .textContent();
    expect(currentLanguage).toContain('🇺🇸');

    const welcomeText = await page.locator('h1, .welcome-text').first().textContent();
    expect(welcomeText).toContain('Welcome');
  });

  test('deve permitir mudança de idioma para espanhol', async ({ page }) => {
    await page.click('.language-selector .dropdown-toggle');

    await page.click('text=Español');

    await page.waitForTimeout(1000);

    const currentLanguage = await page
      .locator('.language-selector .current-language')
      .textContent();
    expect(currentLanguage).toContain('🇪🇸');

    const welcomeText = await page.locator('h1, .welcome-text').first().textContent();
    expect(welcomeText).toContain('Bienvenido');
  });

  test('deve manter preferência de idioma entre sessões', async ({ page, context }) => {
    await page.click('.language-selector .dropdown-toggle');
    await page.click('text=English');
    await page.waitForTimeout(1000);

    const currentLanguage = await page
      .locator('.language-selector .current-language')
      .textContent();
    expect(currentLanguage).toContain('🇺🇸');

    await page.reload();
    await page.waitForSelector('app-language-selector', { timeout: 10000 });

    const reloadedLanguage = await page
      .locator('.language-selector .current-language')
      .textContent();
    expect(reloadedLanguage).toContain('🇺🇸');
  });

  test('deve fechar dropdown ao clicar fora', async ({ page }) => {
    await page.click('.language-selector .dropdown-toggle');

    const dropdown = page.locator('.language-selector .dropdown-menu');
    await expect(dropdown).toBeVisible();

    await page.click('body');

    await expect(dropdown).not.toBeVisible();
  });

  test('deve exibir todos os idiomas suportados', async ({ page }) => {
    await page.click('.language-selector .dropdown-toggle');

    const languages = page.locator('.language-selector .dropdown-menu .language-option');
    await expect(languages).toHaveCount(3);

    await expect(page.locator('text=Português')).toBeVisible();
    await expect(page.locator('text=English')).toBeVisible();
    await expect(page.locator('text=Español')).toBeVisible();
  });

  test('deve destacar idioma atual', async ({ page }) => {
    await page.click('.language-selector .dropdown-toggle');

    const currentOption = page.locator(
      '.language-selector .dropdown-menu .language-option.current'
    );
    await expect(currentOption).toBeVisible();

    const currentText = await currentOption.textContent();
    expect(currentText).toContain('Português');
  });

  test('deve carregar traduções dinamicamente', async ({ page }) => {
    await page.route('**/assets/i18n/*.json', async (route) => {
      const url = route.request().url();
      let response;

      if (url.includes('pt.json')) {
        response = {
          'common.welcome': 'Bem-vindo',
          'common.hello': 'Olá {{name}}',
        };
      } else if (url.includes('en.json')) {
        response = {
          'common.welcome': 'Welcome',
          'common.hello': 'Hello {{name}}',
        };
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    });

    await page.waitForResponse('**/assets/i18n/pt.json');

    await page.click('.language-selector .dropdown-toggle');
    await page.click('text=English');

    await page.waitForResponse('**/assets/i18n/en.json');
  });

  test('deve lidar com erros de carregamento de traduções', async ({ page }) => {
    await page.route('**/assets/i18n/*.json', (route) => {
      route.abort('failed');
    });

    await page.reload();

    await expect(page.locator('app-language-selector')).toBeVisible();

    const welcomeText = await page.locator('h1, .welcome-text').first().textContent();
    expect(welcomeText).toContain('common.welcome') || expect(welcomeText).toBeTruthy();
  });
});
