import { ReleaseDatePrecision } from '../../../models/tracks.enums';
import { SpotifyAlbum, SpotifyTrack } from '../spotify-web.interfaces';

export function spotifyAlbum(overrides: Partial<SpotifyAlbum> = {}): SpotifyAlbum {
  return {
    name: 'Album Name',
    images: [
      { url: 'https://img.test/640.jpg', width: 640, height: 640 },
      { url: 'https://img.test/300.jpg', width: 300, height: 300 },
      { url: 'https://img.test/64.jpg', width: 64, height: 64 },
    ],
    release_date: '2020-01-02',
    release_date_precision: ReleaseDatePrecision.DAY,
    ...overrides,
  };
}

export function spotifyTrack(overrides: Partial<SpotifyTrack> = {}): SpotifyTrack {
  return {
    id: 'track-id',
    name: 'Track Title',
    artists: [{ id: 'artist-1', name: 'Artist One' }],
    album: spotifyAlbum(),
    duration_ms: 215_491,
    external_urls: { spotify: 'https://open.spotify.com/track/track-id' },
    is_playable: true,
    ...overrides,
  };
}
