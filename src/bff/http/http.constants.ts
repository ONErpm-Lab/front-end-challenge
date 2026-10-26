/**
 * What every response carries. The Content-Security-Policy here is the part that needs no list of sources; the
 * pages (HTML) get a stricter one with a `script-src` and a nonce, built per request (see `buildContentSecurityPolicy`).
 */
const BASE_CONTENT_SECURITY_POLICY =
  "base-uri 'self'; object-src 'none'; form-action 'self'; frame-ancestors 'self'";

export const CONTENT_SECURITY_POLICY_HEADER = 'Content-Security-Policy';

/** Where scripts may come from besides the page's own: Spotify's iFrame API, which loads its code from its CDN. */
export const SCRIPT_SOURCES: readonly string[] = [
  'https://open.spotify.com',
  'https://embed-cdn.spotifycdn.com',
];

export const SECURITY_HEADERS: Readonly<Record<string, string>> = {
  [CONTENT_SECURITY_POLICY_HEADER]: BASE_CONTENT_SECURITY_POLICY,
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
};

/** The headers of a static file host, which cannot know the nonce of a page: the page's own policy comes from the server. */
export const STATIC_SECURITY_HEADERS: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(SECURITY_HEADERS).filter(([name]) => name !== CONTENT_SECURITY_POLICY_HEADER),
);

/** The base directives, to build the page policy on. */
export const PAGE_BASE_DIRECTIVES = BASE_CONTENT_SECURITY_POLICY;

/** Sent only on HTTPS: 180 days, for this host only (not its subdomains, which may serve other things). */
export const HSTS_HEADER = 'Strict-Transport-Security';
export const HSTS_VALUE = 'max-age=15552000';

/** Set by the proxy or load balancer in front of the server when the visitor used HTTPS. */
export const FORWARDED_PROTO_HEADER = 'x-forwarded-proto';
