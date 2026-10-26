/** The order of the tracks by title; ISRCs without a track always stay after them. */
export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

/** The status chips above the table: which results the visitor wants to see. */
export enum StatusFilter {
  ALL = 'all',
  AVAILABLE_BR = 'available_br',
  UNAVAILABLE_BR = 'unavailable_br',
  NOT_FOUND = 'not_found',
}
