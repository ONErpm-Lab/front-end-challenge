import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createApp } from './create-app.js';
import { config } from './config.js';
import { createMockAssetsRouter } from './mock/mock-assets.routes.js';
import { createMockSpotifyClient } from './mock/mock-spotify.client.js';
import { createSpotifyClient } from './spotify/spotify.client.js';
import { createTokenService } from './spotify/token.service.js';
import { createTrackService } from './tracks/track.service.js';

/** Composição: o único lugar que decide entre o Spotify real e o simulado. */
function createDataSource() {
  if (config.mode === 'mock') {
    return {
      name: 'mock',
      client: createMockSpotifyClient({ ...config.mock, assetsBaseUrl: '/api/mock' }),
      routers: { '/api/mock': createMockAssetsRouter() },
    };
  }
  return {
    name: 'spotify',
    client: createSpotifyClient(config.spotify, createTokenService(config.spotify)),
    routers: {},
  };
}

/**
 * Em produção a API também serve o build do Angular (um processo, mesma origem).
 * STATIC_DIR sobrescreve; por padrão usa frontend/dist quando o build existe.
 */
function resolveStaticDir() {
  const dir = process.env.STATIC_DIR ?? fileURLToPath(new URL('../../frontend/dist/frontend/browser', import.meta.url));
  return existsSync(dir) ? dir : null;
}

/** Monta a aplicação completa (dados reais ou mock + frontend, se houver build). */
export function composeApp() {
  const source = createDataSource();
  const staticDir = resolveStaticDir();
  const app = createApp({
    trackService: createTrackService(source.client),
    dataSource: source.name,
    routers: source.routers,
    staticDir,
  });
  return { app, source, staticDir };
}
