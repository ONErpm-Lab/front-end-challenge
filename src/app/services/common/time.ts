import { InjectionToken } from '@angular/core';

/** Milliseconds since the epoch. A token so tests can move time without fake timers. */
export const NOW = new InjectionToken<() => number>('NOW', {
  providedIn: 'root',
  factory: () => () => Date.now(),
});

/** Waits `ms` milliseconds. A token so tests do not really wait. */
export const SLEEP = new InjectionToken<(ms: number) => Promise<void>>('SLEEP', {
  providedIn: 'root',
  factory: () => (ms) => new Promise<void>((resolve) => setTimeout(resolve, ms)),
});
