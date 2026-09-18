/**
 * The app's own failure vocabulary.
 *
 * HTTP details stop at the edge of `core/http`. Everything above this line reasons
 * about `AppError`, which is what lets the UI render the alert the spec asks for
 * without knowing that Spotify or HTTP exist at all.
 */
export type AppErrorKind =
  /** Request never reached the provider (offline, DNS, CORS, proxy down). */
  | 'network'
  /** Token proxy refused or the provider rejected our credentials. */
  | 'auth'
  /** Provider answered, but the resource does not exist. */
  | 'notFound'
  /** Provider asked us to slow down and retries were exhausted. */
  | 'rateLimited'
  /** Provider is reachable but broken (5xx), or answered something unusable. */
  | 'provider'
  /** Anything we failed to classify. */
  | 'unknown';

export interface AppError {
  readonly kind: AppErrorKind;
  /** Message safe to show a user. Never contains raw provider payloads. */
  readonly message: string;
  /** Original failure, kept for logging only. */
  readonly cause?: unknown;
}

export const appError = (kind: AppErrorKind, message: string, cause?: unknown): AppError => ({
  kind,
  message,
  cause,
});

/** True when retrying the same request could plausibly succeed. */
export const isRetryable = (error: AppError): boolean =>
  error.kind === 'network' || error.kind === 'rateLimited' || error.kind === 'provider';

/** Narrows an unknown rejection to an {@link AppError}. */
export const isAppError = (error: unknown): error is AppError =>
  typeof error === 'object' &&
  error !== null &&
  'kind' in error &&
  typeof (error as AppError).message === 'string';

/** Narrows an unknown rejection to an {@link AppError} of a specific kind. */
export const isAppErrorOfKind = (error: unknown, kind: AppErrorKind): error is AppError =>
  isAppError(error) && error.kind === kind;
