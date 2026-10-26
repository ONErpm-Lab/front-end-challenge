import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import compression from 'compression';
import express from 'express';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createApiRouter } from './bff/api/create-api-router';
import { loadLocalEnvFile } from './bff/config/config';
import { CONTENT_SECURITY_POLICY_HEADER } from './bff/http/http.constants';
import {
  addNonceToTrustedScripts,
  buildContentSecurityPolicy,
  createNonce,
  securityHeaders,
  trustedInlineScripts,
} from './bff/http/security-headers';

loadLocalEnvFile();

const browserDistFolder = join(import.meta.dirname, '../browser');

/**
 * The inline code of the page template, which the server vouches for with the nonce of each response. Only the production
 * build has the template next to the server; without it (`ng serve`) pages keep the base policy.
 */
const trustedScripts = loadTrustedScripts();

function loadTrustedScripts(): ReadonlySet<string> {
  try {
    return trustedInlineScripts(
      readFileSync(join(import.meta.dirname, 'index.server.html'), 'utf8'),
    );
  } catch {
    return new Set();
  }
}

const app = express();
const angularApp = new AngularNodeAppEngine();

/** Do not tell the world which framework answers. */
app.disable('x-powered-by');

/** Everything below is sent compressed (gzip or Brotli) when the browser accepts it: pages, scripts, styles, JSON. */
app.use(compression());

/** Headers that tell the browser how to treat the page (framing, sniffing, referrer, features, HSTS on HTTPS). */
app.use(securityHeaders());

/** BFF: keeps the Spotify credentials on the server. Must come before the SSR catch-all. */
app.use('/api', createApiRouter({ env: process.env }));

/**
 * The shell of the client-side fallback is a document the renderer reads from disk, never one to hand out: it has none of the
 * nonce handling below, so asking for it gets the page instead.
 */
app.get('/index.csr.html', (_req, res) => res.redirect('/'));

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 * The rendered language follows the saved choice (a cookie) and then `Accept-Language`, so caches must not share
 * pages across languages. Each page gets its own nonce: the policy lets only the scripts that carry it run, and the
 * renderer puts it on the ones it writes (`CSP_NONCE`, see `app.config.server.ts`); the one of `index.html` gets it here.
 */
app.use((req, res, next) => {
  res.vary('Accept-Language');
  res.vary('Cookie');
  const nonce = createNonce();
  angularApp
    .handle(req, { nonce })
    .then(async (response) => {
      if (!response) {
        return next();
      }
      if (trustedScripts.size > 0) {
        res.setHeader(CONTENT_SECURITY_POLICY_HEADER, buildContentSecurityPolicy(nonce));
        return writeResponseToNodeResponse(await withNonce(response, nonce), res);
      }
      return writeResponseToNodeResponse(response, res);
    })
    .catch(next);
});

/** An HTML page gets the nonce on the scripts of its template; anything else (a redirect, a file) goes as it is. */
async function withNonce(response: Response, nonce: string): Promise<Response> {
  if (!response.headers.get('content-type')?.includes('text/html')) {
    return response;
  }
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  return new Response(addNonceToTrustedScripts(await response.text(), nonce, trustedScripts), {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
