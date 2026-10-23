import { BRAZIL, isAvailableInBrazil } from './brazil-availability.js';
import { toTrackDto } from './track.mapper.js';

/**
 * Busca a faixa no mercado BR. Se não vier, tenta sem mercado:
 * a faixa existe, mas não está disponível no Brasil.
 */
export function createTrackService(spotifyClient) {
  return {
    async getByIsrc(isrc) {
      const inBrazil = await spotifyClient.findTrackByIsrc(isrc, BRAZIL);
      if (inBrazil) return toTrackDto(isrc, inBrazil, isAvailableInBrazil(inBrazil));

      const anywhere = await spotifyClient.findTrackByIsrc(isrc);
      return anywhere ? toTrackDto(isrc, anywhere, isAvailableInBrazil(null)) : null;
    },
  };
}
