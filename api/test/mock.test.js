import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/create-app.js';
import { coverSvg, hash, previewWav } from '../src/mock/mock-assets.js';
import { createMockAssetsRouter } from '../src/mock/mock-assets.routes.js';
import { createMockSpotifyClient, PARTIAL_FAILURE_ISRC } from '../src/mock/mock-spotify.client.js';
import { SpotifyUnavailableError } from '../src/spotify/spotify-error.js';
import { createTrackService } from '../src/tracks/track.service.js';

/** O mock passa pelo MESMO serviço, regra do BR e mapper do modo real. */
const buildMockApp = (options = {}) =>
  createApp({
    trackService: createTrackService(createMockSpotifyClient(options)),
    dataSource: 'mock',
    routers: { '/api/mock': createMockAssetsRouter() },
  });

describe('Modo mock', () => {
  it('informa a origem dos dados no cabeçalho X-Data-Source', async () => {
    const res = await request(buildMockApp()).get('/api/tracks/BR1SP1200071');

    expect(res.status).toBe(200);
    expect(res.headers['x-data-source']).toBe('mock');
    expect(res.body).toMatchObject({ title: 'É pra Você', availableInBrazil: true });
  });

  it.each([
    ['BXKZM1900338', 'disponível', true],
    ['BR1SP1500002', 'is_playable: false', false],
    ['NO1R42509310', 'ausente no mercado BR', false],
  ])('%s (%s) → availableInBrazil=%s', async (isrc, _caso, expected) => {
    const res = await request(buildMockApp()).get(`/api/tracks/${isrc}`);

    expect(res.body.availableInBrazil).toBe(expected);
  });

  it('responde 404 para o ISRC fora do catálogo', async () => {
    const res = await request(buildMockApp()).get('/api/tracks/QZNJX2078148');

    expect(res.status).toBe(404);
  });

  it('simula o Spotify fora do ar com o cenário down', async () => {
    const res = await request(buildMockApp({ scenario: 'down' })).get('/api/tracks/BR1SP1200071');

    expect(res.status).toBe(503);
    await expect(createMockSpotifyClient({ scenario: 'down' }).findTrackByIsrc('X')).rejects.toBeInstanceOf(
      SpotifyUnavailableError,
    );
  });

  it('simula a falha de um único ISRC com o cenário partial', async () => {
    const app = buildMockApp({ scenario: 'partial' });

    expect((await request(app).get(`/api/tracks/${PARTIAL_FAILURE_ISRC}`)).status).toBe(503);
    expect((await request(app).get('/api/tracks/BR1SP1200071')).status).toBe(200);
  });

  it('aplica a latência simulada', async () => {
    const start = Date.now();
    await createMockSpotifyClient({ latencyMs: 40 }).findTrackByIsrc('BR1SP1200071', 'BR');

    expect(Date.now() - start).toBeGreaterThanOrEqual(20);
  });

  it('serve capa SVG e prévia WAV das faixas do catálogo', async () => {
    const app = buildMockApp();
    const track = (await request(app).get('/api/tracks/BXKZM1900338')).body;

    const cover = await request(app).get(track.thumbnailUrl);
    const preview = await request(app).get(track.previewUrl).buffer(true);

    expect(cover.headers['content-type']).toMatch('image/svg+xml');
    expect(preview.headers['content-type']).toMatch('audio/wav');
    expect(preview.body.subarray(0, 4).toString()).toBe('RIFF');
  });

  it('responde 404 para arquivos inexistentes', async () => {
    const app = buildMockApp();

    expect((await request(app).get('/api/mock/covers/XX0000000000.svg')).status).toBe(404);
    expect((await request(app).get('/api/mock/previews/BR1SP1200071.wav')).status).toBe(404);
  });
});

describe('mock-assets', () => {
  it('gera sempre a mesma capa para o mesmo ISRC e escapa o título', () => {
    expect(hash('A')).toBe(hash('A'));
    expect(coverSvg('BR1SP1200071', '<x> & y')).toBe(coverSvg('BR1SP1200071', '<x> & y'));
    expect(coverSvg('BR1SP1200071', '<x> & y')).not.toContain('<x>');
  });

  it('gera um WAV PCM válido com a duração pedida', () => {
    const wav = previewWav('BR1SP1200071', 1);

    expect(wav.toString('ascii', 8, 12)).toBe('WAVE');
    expect(wav.readUInt32LE(24)).toBe(22050);
    expect(wav.length).toBe(44 + 22050 * 2);
  });
});
