import { defineConfig, devices } from '@playwright/test';

/**
 * Testes de ponta a ponta contra o stack real:
 *   navegador → ng serve (proxy /api) → API (BFF) em modo mock → catálogo fictício.
 * Nada é simulado no navegador, exceto a queda da integração (ver tracks.e2e.ts).
 */
const API_PORT = 3000; // o proxy.conf.json aponta para cá
const WEB_PORT = 4200;

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: { args: ['--autoplay-policy=no-user-gesture-required'] },
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: [
    {
      command: 'npm start',
      cwd: '../api',
      url: `http://localhost:${API_PORT}/api/health`,
      env: { SPOTIFY_MODE: 'mock', SPOTIFY_MOCK_LATENCY_MS: '0', PORT: String(API_PORT) },
      reuseExistingServer: !process.env['CI'],
      timeout: 30_000,
    },
    {
      command: `npx ng serve --port ${WEB_PORT}`,
      url: `http://localhost:${WEB_PORT}`,
      reuseExistingServer: !process.env['CI'],
      timeout: 180_000,
    },
  ],
});
