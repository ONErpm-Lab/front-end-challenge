// Preloaded with `node --import` into the production server (see playwright.config.ts): answers the two Spotify
// hosts with the REAL responses recorded for the BFF tests, so the server can render the tracks without credentials
// or network. Only the BFF's own `fetch` calls reach it; everything else goes through untouched.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const FIXTURES = join(import.meta.dirname, '..', '..', 'src', 'bff', 'testing', 'fixtures');
const realFetch = globalThis.fetch;

const json = (body) =>
  new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } });

globalThis.fetch = async (input, init) => {
  const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);

  if (url.hostname === 'accounts.spotify.com') {
    return json({ access_token: 'fake-token', token_type: 'Bearer', expires_in: 3600 });
  }
  if (url.hostname === 'api.spotify.com') {
    const isrc = (url.searchParams.get('q') ?? '').replace('isrc:', '');
    const first = Number(url.searchParams.get('offset') ?? 0) === 0;
    if (url.searchParams.get('market') === 'BR' && first) {
      try {
        return json(JSON.parse(readFileSync(join(FIXTURES, `${isrc}.market-br.json`), 'utf8')));
      } catch {
        // Unknown ISRC: Spotify has no track for it.
      }
    }
    return json({ tracks: { items: [], next: null } });
  }
  return realFetch(input, init);
};
