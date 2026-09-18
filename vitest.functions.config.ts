import { defineConfig } from 'vitest/config';

/**
 * The Workers code is a separate TypeScript project from the Angular app and needs
 * its own run: `ng test` is scoped to `src/` and sets up a browser-like environment
 * this code must never rely on.
 *
 * The specs live in `tests/` rather than beside the code because Cloudflare Pages
 * routes every file under `functions/`, and test files have no business being
 * published or bundled into a deploy.
 */
export default defineConfig({
  test: {
    include: ['tests/functions/**/*.spec.ts'],
    environment: 'node',
    globals: true,
  },
});
