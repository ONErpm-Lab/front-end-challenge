import { IsrcQueryKind } from './api.enums';

export type IsrcQuery =
  | { readonly kind: IsrcQueryKind.OK; readonly isrcs: readonly string[] }
  | { readonly kind: IsrcQueryKind.INVALID; readonly invalid: readonly string[] }
  | { readonly kind: IsrcQueryKind.TOO_MANY };
