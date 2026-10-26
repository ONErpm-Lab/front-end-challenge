// Vercel serves everything in the output directory straight from its CDN, before any rewrite. The Angular browser
// build holds `index.csr.html`, the page that the server falls back to when it cannot render, and Vercel hands it
// out for `/`: the visitor would get an empty page and the server would never render. So the CDN gets a copy of the
// browser build without that file, while the function keeps the original (ADR 0021).
import { cpSync, rmSync } from 'node:fs';
import { basename, join } from 'node:path';

const root = process.argv[2] ?? join('dist', 'onerpm-tracks');
const target = join(root, 'static');

rmSync(target, { recursive: true, force: true });
cpSync(join(root, 'browser'), target, {
  recursive: true,
  filter: (source) => basename(source) !== 'index.csr.html',
});
