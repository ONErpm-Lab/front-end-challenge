import { isValidIsrc, normalizeIsrc } from '../../contract/isrc';
import { MAX_ISRCS_PER_REQUEST } from './api.constants';
import { IsrcQueryKind } from './api.enums';
import { IsrcQuery } from './api.types';

/** Accepts `?isrc=A,B` and/or repeated `?isrc=A&isrc=B`; normalizes and de-duplicates preserving order. */
export function parseIsrcQuery(raw: unknown): IsrcQuery {
  const values = (Array.isArray(raw) ? raw : [raw]).filter(
    (value): value is string => typeof value === 'string',
  );
  const candidates = values
    .flatMap((value) => value.split(','))
    .map(normalizeIsrc)
    .filter((value) => value.length > 0);

  if (candidates.length === 0) {
    return { kind: IsrcQueryKind.INVALID, invalid: [] };
  }
  const invalid = candidates.filter((candidate) => !isValidIsrc(candidate));
  if (invalid.length > 0) {
    return { kind: IsrcQueryKind.INVALID, invalid };
  }

  const isrcs = [...new Set(candidates)];
  return isrcs.length > MAX_ISRCS_PER_REQUEST
    ? { kind: IsrcQueryKind.TOO_MANY }
    : { kind: IsrcQueryKind.OK, isrcs };
}
