import { SpotifyUnavailableError } from '../spotify/spotify-error.js';
import { MOCK_CATALOG } from './mock-catalog.js';

const BRAZIL = 'BR';
/** No cenário 'partial', só este ISRC falha: o resto da lista responde normalmente. */
export const PARTIAL_FAILURE_ISRC = 'BRC310600002';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Converte uma entrada do catálogo no formato do objeto `track` da Spotify Web API. */
function toSpotifyTrack(entry, market, assetsBaseUrl) {
  const cover = `${assetsBaseUrl}/covers/${entry.isrc}.svg`;
  return {
    id: entry.spotifyId,
    name: entry.title,
    artists: entry.artists.map((name) => ({ name })),
    album: {
      name: entry.album,
      release_date: entry.releaseDate,
      release_date_precision: entry.precision ?? 'day',
      images: [{ url: cover }, { url: cover }],
    },
    duration_ms: entry.durationMs,
    preview_url: entry.preview ? `${assetsBaseUrl}/previews/${entry.isrc}.wav` : null,
    external_urls: { spotify: `https://open.spotify.com/track/${entry.spotifyId}` },
    ...(market === BRAZIL && { is_playable: entry.inBrazil !== 'not-playable' }),
  };
}

/**
 * Mesmo contrato do cliente real (`findTrackByIsrc(isrc, market)`), sem rede nem credenciais.
 *
 * @param {object} options
 * @param {'ok' | 'down' | 'partial'} [options.scenario] 'down' simula o Spotify fora do ar;
 *   'partial' simula a falha de um único ISRC (instabilidade, rate limit).
 * @param {number} [options.latencyMs] atraso simulado, para a tela mostrar o carregamento.
 * @param {string} [options.assetsBaseUrl] onde a API serve as capas e prévias simuladas.
 */
export function createMockSpotifyClient({ scenario = 'ok', latencyMs = 0, assetsBaseUrl = '/api/mock' } = {}) {
  const byIsrc = new Map(MOCK_CATALOG.map((entry) => [entry.isrc, entry]));

  return {
    async findTrackByIsrc(isrc, market) {
      if (latencyMs) await sleep(latencyMs / 2 + Math.random() * latencyMs);
      if (scenario === 'down') throw new SpotifyUnavailableError('Spotify simulado fora do ar (SPOTIFY_MOCK_SCENARIO=down)');
      if (scenario === 'partial' && isrc === PARTIAL_FAILURE_ISRC) {
        throw new SpotifyUnavailableError('Falha simulada de um ISRC (SPOTIFY_MOCK_SCENARIO=partial)');
      }

      const entry = byIsrc.get(isrc);
      if (!entry) return null;
      if (market === BRAZIL && entry.inBrazil === 'absent') return null;
      return toSpotifyTrack(entry, market, assetsBaseUrl);
    },
  };
}
