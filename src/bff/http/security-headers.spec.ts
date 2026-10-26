// @vitest-environment node
import express from 'express';
import { Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { HSTS_HEADER, SECURITY_HEADERS } from './http.constants';
import {
  addNonceToTrustedScripts,
  buildContentSecurityPolicy,
  createNonce,
  securityHeaders,
  trustedInlineScripts,
} from './security-headers';

let server: Server;

async function get(headers: Record<string, string> = {}): Promise<Response> {
  const app = express();
  app.use(securityHeaders());
  app.get('/', (_request, response) => {
    response.send('ok');
  });
  server = await new Promise<Server>((resolve) => {
    const listening = app.listen(0, '127.0.0.1', () => resolve(listening));
  });
  const { port } = server.address() as AddressInfo;
  return fetch(`http://127.0.0.1:${port}/`, { headers });
}

describe('securityHeaders', () => {
  afterEach(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  it('adds every security header to the response', async () => {
    const response = await get();

    for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
      expect(response.headers.get(name), name).toBe(value);
    }
  });

  it('does not let the page be framed by another site, or sniffed into another type', async () => {
    const response = await get();

    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(response.headers.get('x-frame-options')).toBe('SAMEORIGIN');
    expect(response.headers.get('content-security-policy')).toContain("frame-ancestors 'self'");
  });

  it('denies the browser features the page never uses', async () => {
    const response = await get();

    const policy = response.headers.get('permissions-policy') ?? '';
    for (const feature of ['camera', 'microphone', 'geolocation']) {
      expect(policy).toContain(`${feature}=()`);
    }
  });

  it('leaves the scripts to the policy of the page: the one on every response has no script-src', async () => {
    const response = await get();

    expect(response.headers.get('content-security-policy')).not.toContain('script-src');
    expect(response.headers.get('content-security-policy')).not.toContain('default-src');
  });

  it('does not send HSTS over plain HTTP', async () => {
    const response = await get();

    expect(response.headers.get(HSTS_HEADER)).toBeNull();
  });

  it('sends HSTS when a proxy says the visitor used HTTPS', async () => {
    const response = await get({ 'X-Forwarded-Proto': 'https' });

    expect(response.headers.get(HSTS_HEADER)).toBe('max-age=15552000');
  });

  it('reads the first protocol of a chain of proxies', async () => {
    const secure = await get({ 'X-Forwarded-Proto': 'https, http' });
    expect(secure.headers.get(HSTS_HEADER)).not.toBeNull();
    await new Promise((resolve) => server.close(resolve));

    const insecure = await get({ 'X-Forwarded-Proto': 'http, https' });
    expect(insecure.headers.get(HSTS_HEADER)).toBeNull();
  });

  it('lets the request go on to the next handler', async () => {
    const response = await get();

    expect(await response.text()).toBe('ok');
  });
});

describe('createNonce', () => {
  it('is different every time, and long enough not to be guessed', () => {
    const nonces = new Set(Array.from({ length: 50 }, () => createNonce()));

    expect(nonces.size).toBe(50);
    for (const nonce of nonces) {
      expect(nonce).toMatch(/^[A-Za-z0-9+/]{22}==$/);
    }
  });
});

describe('buildContentSecurityPolicy', () => {
  const policy = buildContentSecurityPolicy('abc123');
  const directive = (name: string) =>
    policy
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(name));

  it('lets scripts run only from the page itself, with the nonce, and from Spotify', () => {
    expect(directive('script-src')).toBe(
      "script-src 'self' 'nonce-abc123' https://open.spotify.com https://embed-cdn.spotifycdn.com",
    );
  });

  it('never allows inline scripts without the nonce, eval or any host', () => {
    expect(policy).not.toContain("'unsafe-inline'");
    expect(policy).not.toContain("'unsafe-eval'");
    expect(directive('script-src')).not.toMatch(/ \*|https: |http:/);
  });

  it('keeps the base directives', () => {
    for (const base of [
      "base-uri 'self'",
      "object-src 'none'",
      "form-action 'self'",
      "frame-ancestors 'self'",
    ]) {
      expect(policy).toContain(base);
    }
  });

  it('does not restrict styles or frames, which PrimeNG and the Spotify player need', () => {
    expect(policy).not.toContain('style-src');
    expect(policy).not.toContain('default-src');
    expect(policy).not.toContain('frame-src');
  });
});

const TEMPLATE = [
  '<script>theme()</script>',
  '<script type="text/javascript" id="ng-event-dispatch-contract">replay()</script>',
  '<script src="main.js" type="module"></script>',
  '<script id="ng-state" type="application/json">{}</script>',
].join('');

describe('trustedInlineScripts', () => {
  it('is the code of the inline scripts of the template, not the ones with a src or the JSON data', () => {
    expect([...trustedInlineScripts(TEMPLATE)]).toEqual(['theme()', 'replay()']);
  });

  it('is empty when the template has no inline code', () => {
    expect(trustedInlineScripts('<p>x</p><script src="a.js"></script>').size).toBe(0);
  });
});

describe('addNonceToTrustedScripts', () => {
  const trusted = trustedInlineScripts(TEMPLATE);

  it('puts the nonce on the scripts of the template, whatever their other attributes', () => {
    expect(addNonceToTrustedScripts(TEMPLATE, 'n0', trusted)).toBe(
      [
        '<script nonce="n0">theme()</script>',
        '<script type="text/javascript" id="ng-event-dispatch-contract" nonce="n0">replay()</script>',
        '<script src="main.js" type="module"></script>',
        '<script id="ng-state" type="application/json">{}</script>',
      ].join(''),
    );
  });

  it('gives it to no other script: one that came in with some content stays without it', () => {
    const rendered = `${TEMPLATE}<main><script>stealCookies()</script><script type="module">evil()</script></main>`;

    const result = addNonceToTrustedScripts(rendered, 'n0', trusted);

    expect(result).toContain('<script>stealCookies()</script>');
    expect(result).toContain('<script type="module">evil()</script>');
    expect(result).not.toContain('stealCookies()</script><script nonce');
    expect(result.match(/nonce="n0"/g)).toHaveLength(2);
  });

  it('does not take a script that only starts with the code of a trusted one', () => {
    const result = addNonceToTrustedScripts('<script>theme();evil()</script>', 'n0', trusted);

    expect(result).toBe('<script>theme();evil()</script>');
  });

  it('leaves alone a script that already has a nonce (the ones Angular writes)', () => {
    expect(addNonceToTrustedScripts('<script nonce="mine">theme()</script>', 'n0', trusted)).toBe(
      '<script nonce="mine">theme()</script>',
    );
  });

  it('gives it to nothing when there is nothing to trust', () => {
    expect(addNonceToTrustedScripts('<script>theme()</script>', 'n0', new Set())).toBe(
      '<script>theme()</script>',
    );
  });

  it('leaves a page with no inline script alone', () => {
    expect(addNonceToTrustedScripts('<p>no scripts</p>', 'n0', trusted)).toBe('<p>no scripts</p>');
  });
});
