import { defer, firstValueFrom, of, throwError } from 'rxjs';
import { appError } from '../errors/app-error';
import { retryBackoff } from './retry-backoff';

/** 1ms base delay keeps real backoff timers from making the suite slow. */
const FAST = 1;

/** Fails the first `failures` subscriptions, then succeeds. Counts attempts. */
function flaky(failures: number, error: unknown) {
  const state = { attempts: 0 };
  const source = defer(() => {
    state.attempts += 1;
    return state.attempts <= failures ? throwError(() => error) : of('ok');
  });
  return { source, state };
}

describe('retryBackoff', () => {
  it('retries a transient failure and succeeds', async () => {
    const { source, state } = flaky(2, appError('provider', 'down'));

    await expect(firstValueFrom(source.pipe(retryBackoff(3, FAST)))).resolves.toBe('ok');
    expect(state.attempts).toBe(3);
  });

  it('counts the first try, so maxRetries is a total attempt budget', async () => {
    const { source, state } = flaky(99, appError('network', 'offline'));

    await expect(firstValueFrom(source.pipe(retryBackoff(3, FAST)))).rejects.toMatchObject({
      kind: 'network',
    });
    expect(state.attempts).toBe(3);
  });

  it('does not retry at all when the budget is one attempt', async () => {
    const { source, state } = flaky(99, appError('provider', 'down'));

    await expect(firstValueFrom(source.pipe(retryBackoff(1, FAST)))).rejects.toBeDefined();
    expect(state.attempts).toBe(1);
  });

  it.each(['auth', 'notFound'] as const)(
    'gives up immediately on a non-retryable %s error',
    async (kind) => {
      const { source, state } = flaky(99, appError(kind, 'nope'));

      await expect(firstValueFrom(source.pipe(retryBackoff(5, FAST)))).rejects.toMatchObject({
        kind,
      });
      // Retrying an unauthorised or missing resource only wastes the provider's quota.
      expect(state.attempts).toBe(1);
    },
  );

  it('rethrows an error that is not an AppError rather than retrying blindly', async () => {
    const { source, state } = flaky(99, new TypeError('boom'));

    await expect(firstValueFrom(source.pipe(retryBackoff(5, FAST)))).rejects.toBeInstanceOf(
      TypeError,
    );
    expect(state.attempts).toBe(1);
  });

  it('passes a successful value straight through', async () => {
    await expect(firstValueFrom(of('value').pipe(retryBackoff(3, FAST)))).resolves.toBe('value');
  });
});
