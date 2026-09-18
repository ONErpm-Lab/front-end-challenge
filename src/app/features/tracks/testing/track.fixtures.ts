import type { SpotifyTrackDto } from '../data/spotify-track.dto';
import type { Track } from '../domain/track';

/** Builders so each test states only the field it actually cares about. */

export const spotifyTrackDto = (overrides: Partial<SpotifyTrackDto> = {}): SpotifyTrackDto => ({
  id: 'track-id',
  name: 'Uma Faixa',
  duration_ms: 213_000,
  preview_url: 'https://p.scdn.co/mp3-preview/abc',
  artists: [{ name: 'Artista Um' }, { name: 'Artista Dois' }],
  album: {
    images: [
      { url: 'https://i.scdn.co/image/small', width: 64, height: 64 },
      { url: 'https://i.scdn.co/image/large', width: 640, height: 640 },
    ],
    release_date: '2019-07-12',
  },
  external_urls: { spotify: 'https://open.spotify.com/track/track-id' },
  external_ids: { isrc: 'BRC310600002' },
  available_markets: ['BR', 'US'],
  ...overrides,
});

export const track = (overrides: Partial<Track> = {}): Track => ({
  isrc: 'BRC310600002',
  id: 'track-id',
  title: 'Uma Faixa',
  artists: ['Artista Um'],
  albumImageUrl: 'https://i.scdn.co/image/large',
  releaseDate: '2019-07-12',
  durationMs: 213_000,
  previewUrl: null,
  spotifyUrl: 'https://open.spotify.com/track/track-id',
  availableInTargetMarket: true,
  ...overrides,
});
