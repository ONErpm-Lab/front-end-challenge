import path from 'node:path';
import express from 'express';
import { createTrackRouter } from './tracks/track.routes.js';

/**
 * @param {object} deps
 * @param {object} deps.trackService
 * @param {'spotify' | 'mock'} [deps.dataSource] informado ao frontend no cabeçalho X-Data-Source.
 * @param {Record<string, import('express').Router>} [deps.routers] rotas extras (ex.: arquivos do mock).
 * @param {string | null} [deps.staticDir] build do Angular a servir no mesmo processo (produção).
 */
export function createApp({ trackService, dataSource = 'spotify', routers = {}, staticDir = null }) {
  const app = express();
  app.disable('x-powered-by');
  app.use((_req, res, next) => {
    res.set('X-Data-Source', dataSource);
    next();
  });
  app.get('/api/health', (_req, res) => res.json({ status: 'ok', dataSource }));
  app.use('/api/tracks', createTrackRouter(trackService));
  for (const [mountPath, router] of Object.entries(routers)) app.use(mountPath, router);
  app.use('/api', (_req, res) => res.status(404).json({ message: 'Rota não encontrada' }));

  if (staticDir) {
    app.use(express.static(staticDir, { index: 'index.html', maxAge: '1h' }));
    // SPA: qualquer outra rota GET devolve o index.html do Angular.
    app.get(/.*/, (_req, res) => res.sendFile(path.join(staticDir, 'index.html')));
  }

  // Erros inesperados: JSON genérico, sem stack para o cliente.
  // eslint-disable-next-line no-unused-vars
  app.use((error, _req, res, _next) => {
    console.error('[api] erro inesperado', error);
    res.status(500).json({ message: 'Erro interno' });
  });
  return app;
}
