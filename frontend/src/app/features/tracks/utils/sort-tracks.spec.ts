import type { Track } from '../models/track.model';
import { sortTracksByTitle } from './sort-tracks';

const track = (title: string) => ({ title, isrc: title }) as Track;

describe('sortTracksByTitle', () => {
  const tracks = [track('zebra'), track('Água'), track('Bloco'), track('arrastão')];

  it('ordena alfabeticamente ignorando acentos e caixa', () => {
    expect(sortTracksByTitle(tracks).map((t) => t.title)).toEqual([
      'Água',
      'arrastão',
      'Bloco',
      'zebra',
    ]);
  });

  it('inverte a ordem em desc e não altera o array original', () => {
    expect(sortTracksByTitle(tracks, 'desc')[0]?.title).toBe('zebra');
    expect(tracks[0]?.title).toBe('zebra');
  });
});
