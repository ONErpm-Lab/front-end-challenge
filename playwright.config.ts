import { defineConfig, devices } from '@playwright/test';

const PORT = 4300;
/** A second server whose Spotify is the recorded one: the page it renders already has the tracks (ssr-data.e2e.ts). */
const SSR_PORT = 4301;
const isCI = !!process.env['CI'];

/**
 * End-to-end tests run against the production build served by the real Express/SSR server
 * (`npm run build` first). Spotify is never contacted: the browser's calls to `/api/tracks` are
 * answered with recorded data, and the server runs WITHOUT credentials, so the "integration
 * unavailable" path is exercised with the real BFF. A second server, on its own port, has the recorded Spotify
 * preloaded (`fake-spotify-preload.mjs`) to prove that the server renders the tracks into the HTML.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  fullyParallel: true,
  // Each test drives a real browser against one Node server: a few workers are plenty and stay stable.
  workers: 2,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } },
    },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: [
    {
      command: 'node dist/onerpm-tracks/server/server.mjs',
      url: `http://localhost:${PORT}`,
      reuseExistingServer: false,
      stdout: 'ignore',
      stderr: 'ignore',
      timeout: 60_000,
      env: {
        PORT: String(PORT),
        NG_ALLOWED_HOSTS: 'localhost',
        // Empty values win over any local .env: the BFF must report the integration as unavailable.
        SPOTIFY_CLIENT_ID: '',
        SPOTIFY_CLIENT_SECRET: '',
      },
    },
    {
      command:
        'node --import ./e2e/support/fake-spotify-preload.mjs dist/onerpm-tracks/server/server.mjs',
      url: `http://localhost:${SSR_PORT}/api/health`,
      reuseExistingServer: false,
      stdout: 'ignore',
      stderr: 'ignore',
      timeout: 60_000,
      env: {
        PORT: String(SSR_PORT),
        NG_ALLOWED_HOSTS: 'localhost',
        // Any value will do: the preloaded fetch answers for Spotify.
        SPOTIFY_CLIENT_ID: 'e2e',
        SPOTIFY_CLIENT_SECRET: 'e2e',
      },
    },
  ],
});
