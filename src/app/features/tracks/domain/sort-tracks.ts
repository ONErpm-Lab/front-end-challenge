import type { Track } from './track';

/**
 * Alphabetical by title, as the spec requires.
 *
 * Uses `localeCompare` with pt-BR so accented titles sort where a Brazilian reader
 * expects them, instead of after `Z` as raw code-point ordering would put them.
 */
export const sortByTitle = (tracks: readonly Track[]): readonly Track[] =>
  [...tracks].sort((a, b) => a.title.localeCompare(b.title, 'pt-BR', { sensitivity: 'base' }));
