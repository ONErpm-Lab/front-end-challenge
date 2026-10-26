export enum ReleaseDatePrecision {
  YEAR = 'year',
  MONTH = 'month',
  DAY = 'day',
}

export enum LookupStatus {
  FOUND = 'found',
  NOT_FOUND = 'not_found',
  ERROR = 'error',
}

export enum LookupErrorCode {
  INTEGRATION_UNAVAILABLE = 'integration_unavailable',
  INTERNAL_ERROR = 'internal_error',
}

export enum ApiErrorCode {
  INVALID_ISRC = 'invalid_isrc',
  TOO_MANY_ISRCS = 'too_many_isrcs',
  INTEGRATION_UNAVAILABLE = 'integration_unavailable',
  INTERNAL_ERROR = 'internal_error',
  NOT_FOUND = 'not_found',
}
