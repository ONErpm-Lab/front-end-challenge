import { ITrack } from '../../modules/tracks/models';

/**
 * Ordena tracks por título usando locale pt-BR
 * @param tracks - Array de tracks para ordenar
 * @returns Array ordenado por título
 */
export function sortByTitlePTBR(tracks: Array<ITrack>): Array<ITrack> {
  return [...tracks].sort((a, b) => {
    return a.name.localeCompare(b.name, 'pt-BR', {
      sensitivity: 'base',
      numeric: true,
    });
  });
}

/**
 * Ordena tracks por artista usando locale pt-BR
 * @param tracks - Array de tracks para ordenar
 * @returns Array ordenado por artista
 */
export function sortByArtistPTBR(tracks: Array<ITrack>): Array<ITrack> {
  return [...tracks].sort((a, b) => {
    const artistA = a.artists[0]?.name || '';
    const artistB = b.artists[0]?.name || '';

    return artistA.localeCompare(artistB, 'pt-BR', {
      sensitivity: 'base',
      numeric: true,
    });
  });
}

/**
 * Ordena tracks por data de lançamento (mais recente primeiro)
 * @param tracks - Array de tracks para ordenar
 * @returns Array ordenado por data de lançamento
 */
export function sortByReleaseDate(tracks: Array<ITrack>): Array<ITrack> {
  return [...tracks].sort((a, b) => {
    const dateA = new Date(a.album.release_date).getTime();
    const dateB = new Date(b.album.release_date).getTime();

    return dateB - dateA; // Mais recente primeiro
  });
}

/**
 * Ordena tracks por duração (mais longa primeiro)
 * @param tracks - Array de tracks para ordenar
 * @returns Array ordenado por duração
 */
export function sortByDuration(tracks: Array<ITrack>): Array<ITrack> {
  return [...tracks].sort((a, b) => {
    return b.duration_ms - a.duration_ms; // Mais longa primeiro
  });
}
