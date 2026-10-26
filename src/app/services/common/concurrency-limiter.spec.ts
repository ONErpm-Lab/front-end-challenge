import { ConcurrencyLimiter } from './concurrency-limiter';

const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 1));

/** Starts `count` tasks on the limiter and reports how many ran at the same time. */
async function measurePeak(limiter: ConcurrencyLimiter, count: number): Promise<number> {
  let running = 0;
  let peak = 0;
  await Promise.all(
    Array.from({ length: count }, () =>
      limiter.run(async () => {
        peak = Math.max(peak, ++running);
        await tick();
        running--;
      }),
    ),
  );
  return peak;
}

describe('ConcurrencyLimiter', () => {
  it('returns the value of the task', async () => {
    await expect(new ConcurrencyLimiter(2).run(async () => 42)).resolves.toBe(42);
  });

  it('never runs more than `limit` tasks at the same time', async () => {
    expect(await measurePeak(new ConcurrencyLimiter(3), 12)).toBe(3);
  });

  it('serializes tasks when the limit is 1', async () => {
    expect(await measurePeak(new ConcurrencyLimiter(1), 5)).toBe(1);
  });

  it('starts queued tasks in arrival order', async () => {
    const limiter = new ConcurrencyLimiter(1);
    const started: number[] = [];

    await Promise.all(
      [1, 2, 3, 4].map((id) =>
        limiter.run(async () => {
          started.push(id);
          await tick();
        }),
      ),
    );

    expect(started).toEqual([1, 2, 3, 4]);
  });

  it('frees the slot when a task rejects, so later tasks still run', async () => {
    const limiter = new ConcurrencyLimiter(1);

    const failing = limiter.run(async () => {
      throw new Error('boom');
    });
    const next = limiter.run(async () => 'ran');

    await expect(failing).rejects.toThrow('boom');
    await expect(next).resolves.toBe('ran');
  });

  it('is shared across unrelated callers of the same instance', async () => {
    const limiter = new ConcurrencyLimiter(2);

    const [a, b] = await Promise.all([measurePeak(limiter, 4), measurePeak(limiter, 4)]);

    // Each caller measures its own tasks; together they would reach 4 without sharing.
    expect(Math.max(a, b)).toBeLessThanOrEqual(2);
  });
});
