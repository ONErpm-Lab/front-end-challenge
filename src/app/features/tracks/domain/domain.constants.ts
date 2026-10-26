import { LookupStatus } from '../../../../contract/tracks.enums';

/**
 * Titles are compared with one fixed, explicitly supported locale, never the UI language nor the
 * runtime default: the order must not change when the visitor switches language, nor differ
 * between the server render and the browser (Latin sorts before Cyrillic, `Ä` next to `A`).
 *
 * `en` has no collation tailoring, so it yields the CLDR root order. Do not use `und`: it is
 * not a supported locale, so `Intl.Collator` silently falls back to the runtime default
 * (with `ru` Cyrillic would sort first, with `sv` `Ä` would sort after `Z`).
 */
export const TITLE_SORT_LOCALE = 'en';

/** Where each kind of result lands in the list: real tracks first, then the ones we could not show. */
export const RESULT_ORDER: Readonly<Record<LookupStatus, number>> = {
  [LookupStatus.FOUND]: 0,
  [LookupStatus.NOT_FOUND]: 1,
  [LookupStatus.ERROR]: 2,
};

export const MS_PER_SECOND = 1000;
export const SECONDS_PER_MINUTE = 60;

/** Shown when a duration is missing or invalid, so the layout never breaks. */
export const ZERO_DURATION = '00:00';
