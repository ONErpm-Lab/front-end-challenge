import { spotifyTrackDto } from '../testing/track.fixtures';
import { toTrack } from './spotify-track.mapper';

describe('toTrack', () => {
  const MARKET = 'BR';

  it('maps every field the page has to render', () => {
    const result = toTrack(spotifyTrackDto(), 'BRC310600002', MARKET);

    expect(result).toEqual({
      isrc: 'BRC310600002',
      id: 'track-id',
      title: 'Uma Faixa',
      artists: ['Artista Um', 'Artista Dois'],
      albumImageUrl: 'https://i.scdn.co/image/large',
      releaseDate: '2019-07-12',
      releaseDatePrecision: 'day',
      durationMs: 213_000,
      previewUrl: 'https://p.scdn.co/mp3-preview/abc',
      spotifyUrl: 'https://open.spotify.com/track/track-id',
      availableInTargetMarket: true,
    });
  });

  it('picks the largest album image regardless of response ordering', () => {
    const dto = spotifyTrackDto({
      album: {
        images: [
          { url: 'https://i.scdn.co/image/large', width: 640 },
          { url: 'https://i.scdn.co/image/small', width: 64 },
        ],
      },
    });

    expect(toTrack(dto, 'X', MARKET)?.albumImageUrl).toBe('https://i.scdn.co/image/large');
  });

  it('reports the track as unavailable when the target market is absent', () => {
    const dto = spotifyTrackDto({ available_markets: ['US', 'GB'] });

    expect(toTrack(dto, 'X', MARKET)?.availableInTargetMarket).toBe(false);
  });

  it('treats a missing available_markets array as unavailable rather than crashing', () => {
    const dto = spotifyTrackDto({ available_markets: undefined });

    expect(toTrack(dto, 'X', MARKET)?.availableInTargetMarket).toBe(false);
  });

  it('falls back to the requested ISRC when Spotify omits it', () => {
    const dto = spotifyTrackDto({ external_ids: {} });

    expect(toTrack(dto, 'QZNJX2081700', MARKET)?.isrc).toBe('QZNJX2081700');
  });

  it('keeps a null preview_url null (Spotify no longer populates it for new apps)', () => {
    const dto = spotifyTrackDto({ preview_url: null });

    expect(toTrack(dto, 'X', MARKET)?.previewUrl).toBeNull();
  });

  it('drops artists without a usable name', () => {
    const dto = spotifyTrackDto({ artists: [{ name: 'Artista Um' }, { name: '  ' }, {}] });

    expect(toTrack(dto, 'X', MARKET)?.artists).toEqual(['Artista Um']);
  });

  it.each([{ id: undefined }, { name: undefined }])(
    'returns null when the payload is missing %o',
    (missing) => {
      expect(toTrack(spotifyTrackDto(missing), 'X', MARKET)).toBeNull();
    },
  );

  it('survives an album with no images at all', () => {
    const dto = spotifyTrackDto({ album: { release_date: '2020' } });

    expect(toTrack(dto, 'X', MARKET)?.albumImageUrl).toBeNull();
  });
});
