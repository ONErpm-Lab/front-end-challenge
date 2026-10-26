import { Request, RequestHandler } from 'express';
import { randomBytes } from 'node:crypto';
import {
  FORWARDED_PROTO_HEADER,
  HSTS_HEADER,
  HSTS_VALUE,
  PAGE_BASE_DIRECTIVES,
  SCRIPT_SOURCES,
  SECURITY_HEADERS,
} from './http.constants';

/** The visitor reached us over HTTPS, directly or through a proxy that says so. */
function isSecure(request: Request): boolean {
  const forwarded = request.headers[FORWARDED_PROTO_HEADER];
  const protocol = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return request.secure || protocol?.split(',')[0].trim() === 'https';
}

/** Adds the security headers to every response (and HSTS when the request came over HTTPS). */
export function securityHeaders(): RequestHandler {
  return (request, response, next) => {
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
      response.setHeader(name, value);
    }
    if (isSecure(request)) {
      response.setHeader(HSTS_HEADER, HSTS_VALUE);
    }
    next();
  };
}

/** A fresh, unguessable value for one response: only scripts that carry it may run (see `buildContentSecurityPolicy`). */
export function createNonce(): string {
  return randomBytes(16).toString('base64');
}

/**
 * The policy of a page: the base directives and a `script-src` that allows the page's own scripts, the ones that carry
 * `nonce` (the inline scripts of the server render and the theme script) and Spotify's iFrame API. An inline script
 * injected by someone else has no nonce, so the browser refuses it. Styles are not restricted (the components and PrimeNG
 * write their own).
 */
export function buildContentSecurityPolicy(nonce: string): string {
  const scriptSources = ["'self'", `'nonce-${nonce}'`, ...SCRIPT_SOURCES].join(' ');
  return `${PAGE_BASE_DIRECTIVES}; script-src ${scriptSources}`;
}

const INLINE_SCRIPT = /<script((?:\s[^>]*)?)>([\s\S]*?)<\/script>/g;

/** A script that is code written in the page: no `src` (covered by `'self'`), no nonce yet, and not JSON data. */
const isInlineCode = (attributes: string): boolean =>
  !/\s(src|nonce)=|application\/json/.test(attributes);

/**
 * The code of the inline scripts of the page template (`index.html`, as the build leaves it for the server): the
 * theme script, which runs before the first paint, and the one of the event replay. This is the only code the server
 * vouches for; `addNonceToTrustedScripts` gives the nonce to scripts with exactly this code and to no other.
 */
export function trustedInlineScripts(template: string): ReadonlySet<string> {
  const code = new Set<string>();
  for (const [, attributes, body] of template.matchAll(INLINE_SCRIPT)) {
    if (isInlineCode(attributes)) {
      code.add(body);
    }
  }
  return code;
}

/**
 * Puts the nonce on the inline scripts of a rendered page whose code is one of the `trusted` ones. Anything else that
 * ended up in the HTML (a script that came in with some content, say) gets no nonce, so the browser refuses it. The
 * scripts that Angular writes itself carry the nonce already (`CSP_NONCE`).
 */
export function addNonceToTrustedScripts(
  html: string,
  nonce: string,
  trusted: ReadonlySet<string>,
): string {
  return html.replace(INLINE_SCRIPT, (script: string, attributes: string, body: string) =>
    isInlineCode(attributes) && trusted.has(body)
      ? `<script${attributes} nonce="${nonce}">${body}</script>`
      : script,
  );
}
