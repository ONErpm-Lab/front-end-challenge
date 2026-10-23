import type { Track } from '@features/tracks/models/track.model';

export function buildTrack(overrides: Partial<Track> = {}): Track {
  return {
    isrc: 'BR1SP1200071',
    spotifyId: '4s71Bub5KzXBSMyE8nlH4E',
    title: 'Faixa',
    artists: ['Artista'],
    albumName: 'Álbum',
    albumImageUrl: null,
    thumbnailUrl: null,
    releaseDate: '2012-05-10',
    releaseDatePrecision: 'day',
    durationMs: 215000,
    previewUrl: null,
    spotifyUrl: 'https://open.spotify.com/track/abc',
    availableInBrazil: true,
    ...overrides,
  };
}
