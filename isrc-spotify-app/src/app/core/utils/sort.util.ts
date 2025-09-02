import { ITrack } from '../../modules/tracks/models';

export function sortByTitlePTBR(tracks: Array<ITrack>): Array<ITrack> {
  return [...tracks].sort((a, b) => {
    return a.name.localeCompare(b.name, 'pt-BR', {
      sensitivity: 'base',
      numeric: true,
    });
  });
}

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

export function sortByReleaseDate(tracks: Array<ITrack>): Array<ITrack> {
  return [...tracks].sort((a, b) => {
    const dateA = new Date(a.album.release_date).getTime();
    const dateB = new Date(b.album.release_date).getTime();

    return dateB - dateA;
  });
}

export function sortByDuration(tracks: Array<ITrack>): Array<ITrack> {
  return [...tracks].sort((a, b) => {
    return b.duration_ms - a.duration_ms;
  });
}
