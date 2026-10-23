import { SpotifyUnavailableError } from './spotify-error.js';

/** Cliente fino da Web API: só a busca por ISRC que o desafio precisa. */
export function createSpotifyClient({ apiUrl, timeoutMs = 5000 }, tokenService, fetchFn = fetch) {
  return {
    /**
     * Busca uma faixa pelo ISRC. Com `market`, o Spotify devolve `is_playable`
     * para aquele país (substitui `available_markets`, removido no Dev Mode).
     */
    async findTrackByIsrc(isrc, market) {
      const token = await tokenService.getToken();
      const params = new URLSearchParams({ q: `isrc:${isrc}`, type: 'track', limit: '1' });
      if (market) params.set('market', market);

      let response;
      try {
        response = await fetchFn(`${apiUrl}/search?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(timeoutMs),
        });
      } catch (error) {
        throw new SpotifyUnavailableError('Não foi possível conectar ao Spotify', error);
      }

      if (!response.ok) {
        throw new SpotifyUnavailableError(`Spotify respondeu com erro (${response.status})`);
      }

      const body = await response.json();
      return body.tracks?.items?.[0] ?? null;
    },
  };
}
