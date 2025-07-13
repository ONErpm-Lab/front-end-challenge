import { missingTrackMapper } from './missing-track.mapper';
import { IMultipleSpotifySearchResponse } from '../../spotify/types/spotify.types';

describe('missingTrackMapper', () => {
  it('should map correctly a track with all fields', () => {
    const input: IMultipleSpotifySearchResponse = [
      {
        isrc: 'ISRC123',
        track: {
          id: '1',
          name: 'Música Teste',
          album: {
            images: [{ url: 'https://img.com/album.jpg' }],
            release_date: '2020-01-01',
          },
          artists: [{ name: 'Artista Teste' }],
          duration_ms: 180000,
          external_urls: { spotify: 'https://open.spotify.com/track/123' },
          available_markets: ['BR'],
          preview_url: 'https://audio.com/preview.mp3',
        },
      },
    ];
    const result = missingTrackMapper(input);
    expect(result.length).toBe(1);
    expect(result[0]).toEqual(
      jasmine.objectContaining({
        name: 'Música Teste',
        albumImage: 'https://img.com/album.jpg',
        hasTrack: true,
        artist: 'Artista Teste',
        albumReleaseDate: '01/01/2020',
        isrc: 'ISRC123',
        duration: '3:00',
        isAvailableInBrazil: true,
        spotifyUrl: 'https://open.spotify.com/track/123',
        previewUrl: 'https://audio.com/preview.mp3',
      })
    );
  });

  it('should map correctly a track with all fields', () => {
    const input: IMultipleSpotifySearchResponse = [
      {
        isrc: 'ISRC456',
        track: null,
      },
    ];
    const result = missingTrackMapper(input);
    expect(result.length).toBe(1);
    expect(result[0]).toEqual(
      jasmine.objectContaining({
        name: null,
        albumImage: null,
        hasTrack: false,
        artist: null,
        albumReleaseDate: null,
        isrc: 'ISRC456',
        duration: '0:00',
        isAvailableInBrazil: false,
        spotifyUrl: null,
        previewUrl: null,
      })
    );
  });
});
