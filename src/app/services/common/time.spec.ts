import { TestBed } from '@angular/core/testing';
import { NOW, SLEEP } from './time';

describe('time tokens', () => {
  afterEach(() => vi.useRealTimers());

  it('NOW is the clock of the browser', () => {
    vi.useFakeTimers({ now: 1_234_567 });

    expect(TestBed.inject(NOW)()).toBe(1_234_567);
  });

  it('SLEEP waits the given time', async () => {
    vi.useFakeTimers();
    let done = false;

    const sleeping = TestBed.inject(SLEEP)(1000).then(() => (done = true));
    await vi.advanceTimersByTimeAsync(999);
    expect(done).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await sleeping;

    expect(done).toBe(true);
  });
});
