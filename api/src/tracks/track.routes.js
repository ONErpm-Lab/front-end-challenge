import { Router } from 'express';
import { SpotifyUnavailableError } from '../spotify/spotify-error.js';

const ISRC_PATTERN = /^[A-Z]{2}[A-Z0-9]{3}\d{7}$/;

export function createTrackRouter(trackService) {
  const router = Router();

  router.get('/:isrc', async (req, res, next) => {
    const isrc = req.params.isrc.toUpperCase();
    if (!ISRC_PATTERN.test(isrc)) {
      return res.status(400).json({ message: `ISRC inválido: ${req.params.isrc}` });
    }

    try {
      const track = await trackService.getByIsrc(isrc);
      if (!track) return res.status(404).json({ message: `Faixa não encontrada: ${isrc}` });
      res.json(track);
    } catch (error) {
      if (error instanceof SpotifyUnavailableError) {
        console.error(`[spotify] ${error.message}`);
        return res.status(503).json({ message: 'Integração com o Spotify indisponível' });
      }
      next(error);
    }
  });

  return router;
}
