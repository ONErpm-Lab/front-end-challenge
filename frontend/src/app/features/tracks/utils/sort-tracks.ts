import type { SortDirection, Track } from '../models/track.model';

const collator = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true });

/** Ordena por título em ordem alfabética, ignorando acentos e caixa. Não altera o array original. */
export function sortTracksByTitle(
  tracks: readonly Track[],
  direction: SortDirection = 'asc',
): Track[] {
  const factor = direction === 'asc' ? 1 : -1;
  return [...tracks].sort((a, b) => factor * collator.compare(a.title, b.title));
}
