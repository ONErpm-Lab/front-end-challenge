import { describe, expect, it } from 'vitest';
import { isAvailableInBrazil } from '../src/tracks/brazil-availability.js';

describe('isAvailableInBrazil', () => {
  it.each([
    [{ is_playable: true }, true],
    [{}, true],
    [{ is_playable: false }, false],
    [null, false],
  ])('%j → %s', (track, expected) => expect(isAvailableInBrazil(track)).toBe(expected));
});
