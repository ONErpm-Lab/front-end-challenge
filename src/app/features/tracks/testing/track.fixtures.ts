import type { SpotifyTrackDto } from '../data/spotify-track.dto';
import type { Track } from '../domain/track';

/** Builders so each test states only the field it actually cares about. */

export const spotifyTrackDto = (overrides: Partial<SpotifyTrackDto> = {}): SpotifyTrackDto => ({
  id: 'track-id',
  name: 'Uma Faixa',
  duration_ms: 213_000,
  preview_url: null,
  artists: [{ name: 'Artista Um' }, { name: 'Artista Dois' }],
  album: {
    images: [
      // The three sizes Spotify actually returns.
      { url: 'https://i.scdn.co/image/640', width: 640, height: 640 },
      { url: 'https://i.scdn.co/image/300', width: 300, height: 300 },
      { url: 'https://i.scdn.co/image/64', width: 64, height: 64 },
    ],
    release_date: '2019-07-12',
  },
  external_urls: { spotify: 'https://open.spotify.com/track/track-id' },
  external_ids: { isrc: 'BRC310600002' },
  is_playable: true,
  ...overrides,
});

export const track = (overrides: Partial<Track> = {}): Track => ({
  isrc: 'BRC310600002',
  id: 'track-id',
  title: 'Uma Faixa',
  artists: ['Artista Um'],
  albumImageUrl: 'https://i.scdn.co/image/300',
  releaseDate: '2019-07-12',
  releaseDatePrecision: 'day',
  durationMs: 213_000,
  previewUrl: null,
  spotifyUrl: 'https://open.spotify.com/track/track-id',
  availableInTargetMarket: true,
  ...overrides,
});
