import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { STATIC_SECURITY_HEADERS } from './bff/http/http.constants';

/**
 * Vercel serves the static files from its CDN and runs the Angular SSR server as one function. Neither the CDN
 * headers nor the entry point are exercised by any other test, so these keep \`vercel.json\`, the entry file and
 * the rest of the project saying the same thing (ADR 0021).
 */
const root = process.cwd();
const read = (file: string) => readFileSync(join(root, file), 'utf8');

interface VercelHeader {
  readonly key: string;
  readonly value: string;
}
interface VercelConfig {
  readonly framework: string | null;
  readonly installCommand: string;
  readonly buildCommand: string;
  readonly outputDirectory: string;
  readonly git: { readonly deploymentEnabled: boolean };
  readonly rewrites: readonly { readonly source: string; readonly destination: string }[];
  readonly functions: Record<
    string,
    { readonly includeFiles?: string; readonly excludeFiles?: string }
  >;
  readonly headers: readonly {
    readonly source: string;
    readonly headers: readonly VercelHeader[];
  }[];
}

const config = JSON.parse(read('vercel.json')) as VercelConfig;
/** Angular writes the build to `dist/<project name>` unless told otherwise (angular.json sets no `outputPath`). */
const angularJson = JSON.parse(read('angular.json')) as {
  projects: Record<string, { architect: { build: { options: { outputPath?: string } } } }>;
};
const [project] = Object.keys(angularJson.projects);
const outputPath = project; // `dist/<project>` is where the build, the entry and vercel.json meet

describe('vercel.json', () => {
  it('builds with the same command as everywhere else, plus the static copy, with no framework preset', () => {
    expect(config.framework).toBeNull();
    expect(config.buildCommand).toBe('npm run build && node scripts/vercel-static.mjs');
  });

  it('installs with the npm version pinned in package.json: the lockfile is not valid for every npm', () => {
    const { packageManager } = JSON.parse(read('package.json')) as { packageManager: string };
    const [, npmVersion] = packageManager.split('@');

    expect(config.installCommand).toBe(`npx --yes npm@${npmVersion} ci`);
  });

  it('serves the copy of the browser build that has no index.csr.html as the static output', () => {
    expect(config.outputDirectory).toBe(`dist/${outputPath}/static`);
  });

  it('sends every request that is not a static file to the function', () => {
    expect(config.rewrites).toEqual([{ source: '/(.*)', destination: '/api/index' }]);
  });

  it('does not let Vercel deploy on every push: deploys come from the release workflow, from the tag', () => {
    expect(config.git.deploymentEnabled).toBe(false);
  });

  it('ships the whole server build with the function', () => {
    expect(config.functions['api/index.mjs'].includeFiles).toBe(`dist/${outputPath}/**`);
    expect(config.functions['api/index.mjs'].excludeFiles).toBe(`dist/${outputPath}/static/**`);
  });

  it('sends the same security headers as the Express middleware (the CDN does not run it)', () => {
    const everything = config.headers.find((rule) => rule.source === '/(.*)');
    const sent = Object.fromEntries(
      (everything?.headers ?? []).map(({ key, value }) => [key, value]),
    );

    expect(sent).toEqual(STATIC_SECURITY_HEADERS);
  });

  it('leaves the Content-Security-Policy of the pages to the server, which has the nonce of each response', () => {
    const everything = config.headers.find((rule) => rule.source === '/(.*)');

    expect(everything?.headers.map(({ key }) => key)).not.toContain('Content-Security-Policy');
  });

  it('caches the hashed files for a year, and nothing else', () => {
    const cached = config.headers.filter((rule) =>
      rule.headers.some((header) => header.key === 'Cache-Control'),
    );

    expect(cached.map((rule) => rule.source)).toEqual([
      '/(chunk|main|styles|polyfills)-(.*)\\.(js|css)',
      '/media/(.*)',
    ]);
    for (const rule of cached) {
      expect(rule.headers).toEqual([
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      ]);
    }
  });
});

describe('the Vercel function entry (api/index.mjs)', () => {
  it('exists, and is the file vercel.json configures', () => {
    expect(existsSync(join(root, 'api', 'index.mjs'))).toBe(true);
    expect(Object.keys(config.functions)).toEqual(['api/index.mjs']);
  });

  it('serves the request handler that the Angular server build exports', () => {
    const entry = read('api/index.mjs');

    expect(entry).toContain(`await import('../dist/${outputPath}/server/server.mjs')`);
    expect(entry).toContain('export default reqHandler;');
  });

  it('trusts the forwarded headers that Vercel sets, before the server is loaded', () => {
    const entry = read('api/index.mjs');
    const trust = entry.indexOf("process.env['NG_TRUST_PROXY_HEADERS']");

    expect(trust).toBeGreaterThan(-1);
    expect(trust).toBeLessThan(entry.indexOf('await import('));
    for (const header of ['x-forwarded-for', 'x-forwarded-host', 'x-forwarded-proto']) {
      expect(entry).toContain(header);
    }
  });

  it('is built by the server, which exports that handler', () => {
    expect(read('src/server.ts')).toContain(
      'export const reqHandler = createNodeRequestHandler(app);',
    );
  });
});

describe('scripts/vercel-static.mjs', () => {
  const script = join(root, 'scripts', 'vercel-static.mjs');
  let build: string;

  beforeEach(() => {
    build = mkdtempSync(join(tmpdir(), 'vercel-static-'));
    mkdirSync(join(build, 'browser', 'media'), { recursive: true });
    writeFileSync(join(build, 'browser', 'index.csr.html'), '<orp-root></orp-root>');
    writeFileSync(join(build, 'browser', 'main-ABC.js'), 'main');
    writeFileSync(join(build, 'browser', 'media', 'font.woff2'), 'font');
    execFileSync('node', [script, build]);
  });

  afterEach(() => rmSync(build, { recursive: true, force: true }));

  it('copies the browser build for the CDN without the page that would be served for "/"', () => {
    expect(existsSync(join(build, 'static', 'main-ABC.js'))).toBe(true);
    expect(existsSync(join(build, 'static', 'media', 'font.woff2'))).toBe(true);
    expect(existsSync(join(build, 'static', 'index.csr.html'))).toBe(false);
  });

  it('leaves the original in place: the server still needs it to fall back to the client', () => {
    expect(existsSync(join(build, 'browser', 'index.csr.html'))).toBe(true);
  });
});

describe('the build output that the Vercel config points at', () => {
  it('is the default one: angular.json does not move it', () => {
    expect(angularJson.projects[project].architect.build.options.outputPath).toBeUndefined();
  });
});
