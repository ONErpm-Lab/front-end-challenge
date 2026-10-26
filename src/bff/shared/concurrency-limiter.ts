/**
 * Semaphore: runs at most `limit` tasks at once and queues the rest in arrival order.
 * Share one instance to bound a resource across unrelated callers (e.g. concurrent HTTP requests).
 */
export class ConcurrencyLimiter {
  private _active = 0;
  private readonly _waiting: (() => void)[] = [];

  constructor(private readonly _limit: number) {}

  public async run<T>(task: () => Promise<T>): Promise<T> {
    await this._acquire();
    try {
      return await task();
    } finally {
      this._release();
    }
  }

  private async _acquire(): Promise<void> {
    if (this._active < this._limit) {
      this._active++;
      return;
    }
    // The slot is handed over by _release(), so `_active` stays unchanged.
    await new Promise<void>((resolve) => this._waiting.push(resolve));
  }

  private _release(): void {
    const next = this._waiting.shift();
    if (next) {
      next();
    } else {
      this._active--;
    }
  }
}
