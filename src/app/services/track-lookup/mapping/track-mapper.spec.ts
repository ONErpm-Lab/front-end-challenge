import { ReleaseDatePrecision } from '../../../models/tracks.enums';
import { spotifyAlbum, spotifyTrack } from '../../../api/spotify-web/testing/builders';
import { toTrack } from './track-mapper';

const CONTEXT = { isrc: 'BR1SP1200071', availableInBR: true, releases: [] };
const DAY = ReleaseDatePrecision.DAY;
const releasedOn = (release_date: string, release_date_precision = DAY) =>
  spotifyTrack({ album: spotifyAlbum({ release_date, release_date_precision }) });

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
      releaseDates: [{ value: '2014-05-12', precision: ReleaseDatePrecision.DAY }],
      durationMs: 177_626,
      spotifyUrl: 'https://open.spotify.com/track/7q7QtMiK9jhob0Md7p715D',
      availableInBR: true,
    });
  });

  describe('release dates', () => {
    it('lists every distinct date of the releases, oldest first, the shown one included', () => {
      const shown = releasedOn('2014-03-25');
      const releases = [releasedOn('2014-05-12'), shown, releasedOn('2014-05-12')];

      expect(toTrack(shown, { ...CONTEXT, releases }).releaseDates).toEqual([
        { value: '2014-03-25', precision: DAY },
        { value: '2014-05-12', precision: DAY },
      ]);
    });

    it('has only the shown date when the releases agree', () => {
      const shown = releasedOn('2019-10-04');

      expect(
        toTrack(shown, { ...CONTEXT, releases: [shown, releasedOn('2019-10-04')] }).releaseDates,
      ).toEqual([{ value: '2019-10-04', precision: DAY }]);
    });

    it('keeps the precision of each date', () => {
      const shown = releasedOn('2014', ReleaseDatePrecision.YEAR);

      expect(
        toTrack(shown, {
          ...CONTEXT,
          releases: [releasedOn('2014-05', ReleaseDatePrecision.MONTH)],
        }).releaseDates,
      ).toEqual([
        { value: '2014', precision: ReleaseDatePrecision.YEAR },
        { value: '2014-05', precision: ReleaseDatePrecision.MONTH },
      ]);
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
