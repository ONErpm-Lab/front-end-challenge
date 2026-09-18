/**
 * Cloudflare Pages Function — `POST /api/spotify-token`.
 *
 * The single reason this file exists: the Spotify Client Credentials flow needs a
 * client secret, and the challenge requires a *public* page. Keeping the exchange
 * server-side is what allows the browser bundle to stay secret-free.
 *
 * Runtime is Workers (V8 isolate), not Node: no `process`, no Node built-ins.
 * Secrets arrive through `context.env` (`.dev.vars` locally, Pages secrets in prod).
 */

import { requestAccessToken, TokenRequestError } from '../spotify-token.service';

interface Env {
  readonly SPOTIFY_CLIENT_ID?: string;
  readonly SPOTIFY_CLIENT_SECRET?: string;
}

/** Tokens are short-lived and per-request; never let a cache hold one. */
const NO_STORE = {
  'Cache-Control': 'no-store',
  'Content-Type': 'application/json',
} as const;

const json = (body: unknown, status: number): Response =>
  new Response(JSON.stringify(body), { status, headers: NO_STORE });

export const onRequestPost: PagesFunction<Env> = async ({ env }) => {
  const clientId = env.SPOTIFY_CLIENT_ID;
  const clientSecret = env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    // Misconfiguration is ours, not the caller's — say so without naming the vars.
    console.error('Spotify credentials are not configured for this environment.');
    return json({ error: 'provider_unavailable' }, 503);
  }

  try {
    return json(await requestAccessToken({ clientId, clientSecret }), 200);
  } catch (error) {
    // Logged in full server-side; the browser only ever learns that it failed.
    console.error('Spotify token exchange failed:', error);
    const status = error instanceof TokenRequestError && error.status === 429 ? 429 : 502;
    return json({ error: 'provider_unavailable' }, status);
  }
};

/**
 * Catch-all for this route. Without it a non-POST request falls through to the SPA
 * rewrite in `public/_redirects` and answers HTML from an API endpoint.
 * Pages routes method-specific handlers first, so this only ever sees non-POST.
 */
export const onRequest: PagesFunction<Env> = async () => json({ error: 'method_not_allowed' }, 405);
