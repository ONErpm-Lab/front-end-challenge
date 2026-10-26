// Vercel entry point: the Angular SSR server that `npm run build` produces (Express, the BFF under /api and the
// renderer), served as one function. Static files (the browser build) are served by Vercel's CDN before it.
// `vercel.json` sends every other request here; see ADR 0021.

// Vercel's edge sets these headers on every request (a client cannot forge them), and the renderer ignores them
// unless told to trust them: it would answer with the empty client-side page, never rendering on the server. The
// host is still checked against NG_ALLOWED_HOSTS. Set before the server is loaded, which reads it at start-up.
process.env['NG_TRUST_PROXY_HEADERS'] ??=
  'x-forwarded-for,x-forwarded-host,x-forwarded-proto,x-forwarded-port';

const { reqHandler } = await import('../dist/onerpm-tracks/server/server.mjs');

export default reqHandler;
