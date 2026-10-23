import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/create-app.js';
import { createSpotifyClient } from '../src/spotify/spotify.client.js';
import { createTokenService } from '../src/spotify/token.service.js';
import { createTrackService } from '../src/tracks/track.service.js';
import { jsonResponse, spotifyTrack } from './fixtures.js';

/** Monta o app real, trocando apenas o fetch (a borda com o Spotify). */
function buildApp(fetchFn) {
  const spotify = { clientId: 'id', clientSecret: 'secret', accountsUrl: 'https://accounts.test', apiUrl: 'https://api.test' };
  const client = createSpotifyClient(spotify, createTokenService(spotify, fetchFn), fetchFn);
  return createApp({ trackService: createTrackService(client) });
}

const spotifyFake = (searchResponse) =>
  vi.fn((url) =>
    Promise.resolve(
      url.startsWith('https://accounts.test') ? jsonResponse({ access_token: 'tok', expires_in: 3600 }) : searchResponse(),
    ),
  );

describe('GET /api/tracks/:isrc', () => {
  it('devolve a faixa mapeada', async () => {
    const fetchFn = spotifyFake(() => jsonResponse({ tracks: { items: [spotifyTrack] } }));

    const res = await request(buildApp(fetchFn)).get('/api/tracks/br1sp1200071');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ isrc: 'BR1SP1200071', durationMs: 215000, availableInBrazil: true });
    expect(fetchFn.mock.calls[1][0]).toContain('market=BR');
  });

  it('responde 404 quando o ISRC não existe no Spotify', async () => {
    const res = await request(buildApp(spotifyFake(() => jsonResponse({ tracks: { items: [] } })))).get(
      '/api/tracks/BR1SP1200071',
    );

    expect(res.status).toBe(404);
  });

  it('responde 400 para ISRC inválido', async () => {
    const res = await request(buildApp(vi.fn())).get('/api/tracks/abc');

    expect(res.status).toBe(400);
  });

  it('responde 503 quando o Spotify está fora', async () => {
    const res = await request(buildApp(spotifyFake(() => jsonResponse({}, 502)))).get('/api/tracks/BR1SP1200071');

    expect(res.status).toBe(503);
    expect(res.body.message).toMatch(/indisponível/);
  });
});
