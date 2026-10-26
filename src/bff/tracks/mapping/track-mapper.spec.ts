import { ReleaseDatePrecision } from '../../../contract/tracks.enums';
// @vitest-environment node
import { spotifyAlbum, spotifyTrack } from '../../testing/builders';
import { toTrack } from './track-mapper';

const CONTEXT = { isrc: 'BR1SP1200071', availableInBR: true };

describe('toTrack', () => {
  it('maps every field the UI needs', () => {
    const dto = spotifyTrack({
      id: '7q7QtMiK9jhob0Md7p715D',
      name: '...É pra Você',
      artists: [
        { id: '1', name: 'Gó Gó Boys' },
        { id: '2', name: 'Convidado' },
      ],
      duration_ms: 177_626,
      external_urls: { spotify: 'https://open.spotify.com/track/7q7QtMiK9jhob0Md7p715D' },
      album: spotifyAlbum({
        name: 'Gó Gó Boys',
        release_date: '2014-05-12',
        release_date_precision: ReleaseDatePrecision.DAY,
      }),
    });

    expect(toTrack(dto, CONTEXT)).toEqual({
      id: '7q7QtMiK9jhob0Md7p715D',
      isrc: 'BR1SP1200071',
      title: '...É pra Você',
      artists: ['Gó Gó Boys', 'Convidado'],
      albumName: 'Gó Gó Boys',
      coverUrl: 'https://img.test/300.jpg',
      releaseDate: { value: '2014-05-12', precision: ReleaseDatePrecision.DAY },
      durationMs: 177_626,
      spotifyUrl: 'https://open.spotify.com/track/7q7QtMiK9jhob0Md7p715D',
      availableInBR: true,
    });
  });

  it('carries the Brazil availability from the context', () => {
    expect(toTrack(spotifyTrack(), { ...CONTEXT, availableInBR: false }).availableInBR).toBe(false);
  });

  it.each([
    [ReleaseDatePrecision.YEAR, '2019'],
    [ReleaseDatePrecision.MONTH, '2019-10'],
  ] as const)('keeps %s-precision release dates untouched', (precision, value) => {
    const dto = spotifyTrack({
      album: spotifyAlbum({ release_date: value, release_date_precision: precision }),
    });

    expect(toTrack(dto, CONTEXT).releaseDate).toEqual({ value, precision });
  });

  describe('cover selection', () => {
    const images = (...widths: (number | null)[]) =>
      widths.map((width) => ({ url: `https://img.test/${width}.jpg`, width, height: width }));

    it('picks the image closest to 300px regardless of order', () => {
      const dto = spotifyTrack({ album: spotifyAlbum({ images: images(64, 640, 300) }) });

      expect(toTrack(dto, CONTEXT).coverUrl).toBe('https://img.test/300.jpg');
    });

    it('falls back to the closest available size when 300px is missing', () => {
      const dto = spotifyTrack({ album: spotifyAlbum({ images: images(640, 64) }) });

      expect(toTrack(dto, CONTEXT).coverUrl).toBe('https://img.test/64.jpg');
    });

    it('prefers images with a known width over unknown ones', () => {
      const dto = spotifyTrack({ album: spotifyAlbum({ images: images(null, 640) }) });

      expect(toTrack(dto, CONTEXT).coverUrl).toBe('https://img.test/640.jpg');
    });

    it('still returns an image when no width is known', () => {
      const dto = spotifyTrack({ album: spotifyAlbum({ images: images(null) }) });

      expect(toTrack(dto, CONTEXT).coverUrl).toBe('https://img.test/null.jpg');
    });

    it('returns null when the album has no artwork', () => {
      const dto = spotifyTrack({ album: spotifyAlbum({ images: [] }) });

      expect(toTrack(dto, CONTEXT).coverUrl).toBeNull();
    });
  });
});
