import { retry, timer, type MonoTypeOperatorFunction } from 'rxjs';
import { isRetryable, type AppError } from '../errors/app-error';

/**
 * Exponential backoff for transient provider failures, reused by every caller
 * instead of being re-implemented per service.
 *
 * Runs downstream of {@link httpErrorInterceptor}, so it decides using `AppError`
 * rather than status codes — one classification, one owner.
 */
export function retryBackoff<T>(
  maxRetries: number,
  baseDelayMs = 400,
): MonoTypeOperatorFunction<T> {
  return retry<T>({
    count: Math.max(0, maxRetries - 1),
    delay: (error: unknown, retryCount: number) => {
      if (!isAppError(error) || !isRetryable(error)) {
        throw error;
      }
      // 400ms, 800ms, 1600ms, ... with jitter so parallel lookups don't resynchronise.
      const backoff = baseDelayMs * 2 ** (retryCount - 1);
      return timer(backoff + Math.random() * baseDelayMs);
    },
  });
}

const isAppError = (error: unknown): error is AppError =>
  typeof error === 'object' && error !== null && 'kind' in error && 'message' in error;
