const clientId = process.env.SPOTIFY_CLIENT_ID ?? '';
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET ?? '';

/**
 * 'live' consulta o Spotify; 'mock' usa o catálogo de demonstração.
 * Sem SPOTIFY_MODE, usa 'live' se houver credenciais e 'mock' caso contrário.
 */
function resolveMode() {
  const mode = process.env.SPOTIFY_MODE || (clientId && clientSecret ? 'live' : 'mock');
  if (mode !== 'live' && mode !== 'mock') throw new Error(`SPOTIFY_MODE inválido: "${mode}" (use live ou mock)`);
  return mode;
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  mode: resolveMode(),
  spotify: {
    clientId,
    clientSecret,
    accountsUrl: 'https://accounts.spotify.com/api/token',
    apiUrl: 'https://api.spotify.com/v1',
  },
  mock: {
    scenario: ['down', 'partial'].includes(process.env.SPOTIFY_MOCK_SCENARIO ?? '')
      ? process.env.SPOTIFY_MOCK_SCENARIO
      : 'ok',
    latencyMs: Number(process.env.SPOTIFY_MOCK_LATENCY_MS ?? 400),
  },
};
