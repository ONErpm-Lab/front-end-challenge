import { Router } from 'express';
import { CACHE_CONTROL_NO_STORE } from './api.constants';

/**
 * `GET /api/health`: "the server is up", for the container health check and the hosting platform. It does not
 * call Spotify, so a Spotify outage never makes the platform restart a server that is working. It does say
 * whether the Spotify credentials are configured (never their values), so a monitor can tell a missing
 * configuration from an outage at Spotify.
 */
export function createHealthRouter(spotifyConfigured: boolean): Router {
  const router = Router();
  router.get('/health', (_request, response) => {
    response
      .set('Cache-Control', CACHE_CONTROL_NO_STORE)
      .json({ status: 'ok', spotify: spotifyConfigured ? 'configured' : 'missing_credentials' });
  });
  return router;
}
