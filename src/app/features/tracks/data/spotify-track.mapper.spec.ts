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
      albumImageUrl: 'https://i.scdn.co/image/300',
      releaseDate: '2019-07-12',
      releaseDatePrecision: 'day',
      durationMs: 213_000,
      previewUrl: null,
      spotifyUrl: 'https://open.spotify.com/track/track-id',
      availableInTargetMarket: true,
    });
  });

  it('picks the smallest cover still big enough to render sharply', () => {
    const dto = spotifyTrackDto({
      album: {
        images: [
          { url: 'https://i.scdn.co/image/640', width: 640 },
          { url: 'https://i.scdn.co/image/300', width: 300 },
          { url: 'https://i.scdn.co/image/64', width: 64 },
        ],
      },
    });

    // 640 would cost roughly four times the bytes for a slot this size.
    expect(toTrack(dto, 'X', MARKET)?.albumImageUrl).toBe('https://i.scdn.co/image/300');
  });

  it('does not depend on the order Spotify lists the covers in', () => {
    const dto = spotifyTrackDto({
      album: {
        images: [
          { url: 'https://i.scdn.co/image/64', width: 64 },
          { url: 'https://i.scdn.co/image/640', width: 640 },
          { url: 'https://i.scdn.co/image/300', width: 300 },
        ],
      },
    });

    expect(toTrack(dto, 'X', MARKET)?.albumImageUrl).toBe('https://i.scdn.co/image/300');
  });

  it('falls back to the largest when every cover is smaller than preferred', () => {
    const dto = spotifyTrackDto({
      album: {
        images: [
          { url: 'https://i.scdn.co/image/64', width: 64 },
          { url: 'https://i.scdn.co/image/160', width: 160 },
        ],
      },
    });

    expect(toTrack(dto, 'X', MARKET)?.albumImageUrl).toBe('https://i.scdn.co/image/160');
  });

  it('reports availability from is_playable, which is what Spotify returns today', () => {
    const dto = spotifyTrackDto({ is_playable: false });

    expect(toTrack(dto, 'X', MARKET)?.availableInTargetMarket).toBe(false);
  });

  it('falls back to the legacy available_markets list when is_playable is absent', () => {
    expect(
      toTrack(spotifyTrackDto({ is_playable: undefined, available_markets: ['BR'] }), 'X', MARKET)
        ?.availableInTargetMarket,
    ).toBe(true);

    expect(
      toTrack(spotifyTrackDto({ is_playable: undefined, available_markets: ['US'] }), 'X', MARKET)
        ?.availableInTargetMarket,
    ).toBe(false);
  });

  it('reports unavailable when Spotify sends neither signal', () => {
    const dto = spotifyTrackDto({ is_playable: undefined, available_markets: undefined });

    expect(toTrack(dto, 'X', MARKET)?.availableInTargetMarket).toBe(false);
  });

  it('falls back to the requested ISRC when Spotify omits it', () => {
    const dto = spotifyTrackDto({ external_ids: {} });

    expect(toTrack(dto, 'QZNJX2081700', MARKET)?.isrc).toBe('QZNJX2081700');
  });

  it('normalises an absent preview_url to null (Spotify omits the field entirely)', () => {
    expect(
      toTrack(spotifyTrackDto({ preview_url: undefined }), 'X', MARKET)?.previewUrl,
    ).toBeNull();
    expect(toTrack(spotifyTrackDto({ preview_url: null }), 'X', MARKET)?.previewUrl).toBeNull();
  });

  it('still uses a preview_url when one is present', () => {
    const dto = spotifyTrackDto({ preview_url: 'https://p.scdn.co/mp3-preview/abc' });

    expect(toTrack(dto, 'X', MARKET)?.previewUrl).toBe('https://p.scdn.co/mp3-preview/abc');
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
