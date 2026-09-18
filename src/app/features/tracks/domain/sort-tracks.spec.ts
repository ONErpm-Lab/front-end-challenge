import { track } from '../testing/track.fixtures';
import { sortByTitle } from './sort-tracks';

describe('sortByTitle', () => {
  it('orders tracks alphabetically by title', () => {
    const sorted = sortByTitle([
      track({ title: 'Zumbi' }),
      track({ title: 'Alegria' }),
      track({ title: 'Marimbondo' }),
    ]);

    expect(sorted.map((t) => t.title)).toEqual(['Alegria', 'Marimbondo', 'Zumbi']);
  });

  it('sorts accented titles where a pt-BR reader expects them, not after Z', () => {
    const sorted = sortByTitle([track({ title: 'Azul' }), track({ title: 'Água' })]);

    expect(sorted.map((t) => t.title)).toEqual(['Água', 'Azul']);
  });

  it('ignores case when comparing', () => {
    const sorted = sortByTitle([track({ title: 'banana' }), track({ title: 'Abacaxi' })]);

    expect(sorted.map((t) => t.title)).toEqual(['Abacaxi', 'banana']);
  });

  it('does not mutate the input array', () => {
    const input = [track({ title: 'Zumbi' }), track({ title: 'Alegria' })];

    sortByTitle(input);

    expect(input.map((t) => t.title)).toEqual(['Zumbi', 'Alegria']);
  });
});
