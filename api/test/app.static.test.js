import { fileURLToPath } from 'node:url';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/create-app.js';

const staticDir = fileURLToPath(new URL('./fixtures-static', import.meta.url));
const trackService = { getByIsrc: vi.fn().mockRejectedValue(new Error('boom')) };

describe('App — produção (um processo)', () => {
  const app = createApp({ trackService, staticDir });

  it('serve o index.html do Angular na raiz e em qualquer rota (SPA)', async () => {
    for (const path of ['/', '/qualquer/rota']) {
      const res = await request(app).get(path);
      expect(res.status).toBe(200);
      expect(res.text).toContain('<title>spa</title>');
    }
  });

  it('responde 404 em JSON para rotas /api desconhecidas, sem cair no index.html', async () => {
    const res = await request(app).get('/api/nao-existe');

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Rota não encontrada');
  });

  it('erros inesperados viram 500 em JSON, sem detalhes internos', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await request(app).get('/api/tracks/BR1SP1200071');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: 'Erro interno' });
  });
});
