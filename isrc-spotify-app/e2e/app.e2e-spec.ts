import { test, expect } from '@playwright/test';

test.describe('Sistema de Localização E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar para a página inicial
    await page.goto('/');

    // Aguardar o carregamento da aplicação
    await page.waitForSelector('app-language-selector', { timeout: 10000 });
  });

  test('deve carregar com idioma padrão (português)', async ({ page }) => {
    // Verificar se o idioma padrão é português
    const currentLanguage = await page
      .locator('.language-selector .current-language')
      .textContent();
    expect(currentLanguage).toContain('🇧🇷');

    // Verificar se os textos estão em português
    const welcomeText = await page.locator('h1, .welcome-text').first().textContent();
    expect(welcomeText).toContain('Bem-vindo');
  });

  test('deve permitir mudança de idioma para inglês', async ({ page }) => {
    // Abrir o seletor de idioma
    await page.click('.language-selector .dropdown-toggle');

    // Selecionar inglês
    await page.click('text=English');

    // Aguardar a mudança de idioma
    await page.waitForTimeout(1000);

    // Verificar se o idioma foi alterado
    const currentLanguage = await page
      .locator('.language-selector .current-language')
      .textContent();
    expect(currentLanguage).toContain('🇺🇸');

    // Verificar se os textos estão em inglês
    const welcomeText = await page.locator('h1, .welcome-text').first().textContent();
    expect(welcomeText).toContain('Welcome');
  });

  test('deve permitir mudança de idioma para espanhol', async ({ page }) => {
    // Abrir o seletor de idioma
    await page.click('.language-selector .dropdown-toggle');

    // Selecionar espanhol
    await page.click('text=Español');

    // Aguardar a mudança de idioma
    await page.waitForTimeout(1000);

    // Verificar se o idioma foi alterado
    const currentLanguage = await page
      .locator('.language-selector .current-language')
      .textContent();
    expect(currentLanguage).toContain('🇪🇸');

    // Verificar se os textos estão em espanhol
    const welcomeText = await page.locator('h1, .welcome-text').first().textContent();
    expect(welcomeText).toContain('Bienvenido');
  });

  test('deve manter preferência de idioma entre sessões', async ({ page, context }) => {
    // Mudar para inglês
    await page.click('.language-selector .dropdown-toggle');
    await page.click('text=English');
    await page.waitForTimeout(1000);

    // Verificar se mudou para inglês
    const currentLanguage = await page
      .locator('.language-selector .current-language')
      .textContent();
    expect(currentLanguage).toContain('🇺🇸');

    // Recarregar a página
    await page.reload();
    await page.waitForSelector('app-language-selector', { timeout: 10000 });

    // Verificar se o idioma foi mantido
    const reloadedLanguage = await page
      .locator('.language-selector .current-language')
      .textContent();
    expect(reloadedLanguage).toContain('🇺🇸');
  });

  test('deve fechar dropdown ao clicar fora', async ({ page }) => {
    // Abrir o seletor de idioma
    await page.click('.language-selector .dropdown-toggle');

    // Verificar se está aberto
    const dropdown = page.locator('.language-selector .dropdown-menu');
    await expect(dropdown).toBeVisible();

    // Clicar fora do dropdown
    await page.click('body');

    // Verificar se fechou
    await expect(dropdown).not.toBeVisible();
  });

  test('deve exibir todos os idiomas suportados', async ({ page }) => {
    // Abrir o seletor de idioma
    await page.click('.language-selector .dropdown-toggle');

    // Verificar se todos os idiomas estão disponíveis
    const languages = page.locator('.language-selector .dropdown-menu .language-option');
    await expect(languages).toHaveCount(3);

    // Verificar idiomas específicos
    await expect(page.locator('text=Português')).toBeVisible();
    await expect(page.locator('text=English')).toBeVisible();
    await expect(page.locator('text=Español')).toBeVisible();
  });

  test('deve destacar idioma atual', async ({ page }) => {
    // Abrir o seletor de idioma
    await page.click('.language-selector .dropdown-toggle');

    // Verificar se o português está destacado como atual
    const currentOption = page.locator(
      '.language-selector .dropdown-menu .language-option.current'
    );
    await expect(currentOption).toBeVisible();

    const currentText = await currentOption.textContent();
    expect(currentText).toContain('Português');
  });

  test('deve carregar traduções dinamicamente', async ({ page }) => {
    // Interceptar requisições de tradução
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

    // Verificar carregamento inicial
    await page.waitForResponse('**/assets/i18n/pt.json');

    // Mudar para inglês
    await page.click('.language-selector .dropdown-toggle');
    await page.click('text=English');

    // Verificar nova requisição
    await page.waitForResponse('**/assets/i18n/en.json');
  });

  test('deve lidar com erros de carregamento de traduções', async ({ page }) => {
    // Interceptar e simular erro
    await page.route('**/assets/i18n/*.json', (route) => {
      route.abort('failed');
    });

    // Recarregar a página
    await page.reload();

    // Verificar se a aplicação continua funcionando
    await expect(page.locator('app-language-selector')).toBeVisible();

    // Verificar se os textos são exibidos como chaves (fallback)
    const welcomeText = await page.locator('h1, .welcome-text').first().textContent();
    expect(welcomeText).toContain('common.welcome') || expect(welcomeText).toBeTruthy();
  });
});
