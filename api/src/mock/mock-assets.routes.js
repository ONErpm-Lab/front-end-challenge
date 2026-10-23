import { Router } from 'express';
import { coverSvg, previewWav } from './mock-assets.js';
import { MOCK_CATALOG } from './mock-catalog.js';

/** Serve as capas e prévias do catálogo de demonstração. Só é montado no modo mock. */
export function createMockAssetsRouter() {
  const router = Router();
  const byIsrc = new Map(MOCK_CATALOG.map((entry) => [entry.isrc, entry]));
  const cache = 'public, max-age=86400';

  router.get('/covers/:isrc.svg', (req, res) => {
    const entry = byIsrc.get(req.params.isrc);
    if (!entry) return res.sendStatus(404);
    res.type('image/svg+xml').set('Cache-Control', cache).send(coverSvg(entry.isrc, entry.title));
  });

  router.get('/previews/:isrc.wav', (req, res) => {
    const entry = byIsrc.get(req.params.isrc);
    if (!entry?.preview) return res.sendStatus(404);
    res.type('audio/wav').set('Cache-Control', cache).send(previewWav(entry.isrc));
  });

  return router;
}
