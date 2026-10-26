import { MS_PER_SECOND, SECONDS_PER_MINUTE, ZERO_DURATION } from './domain.constants';

/**
 * Formats a duration as `mm:ss`, rounded to the nearest second. Minutes are not capped at 59
 * (a 75-minute track is `75:00`), because there is no hour field to carry into.
 */
export function formatDuration(durationMs: number): string {
  if (!Number.isFinite(durationMs) || durationMs < 0) {
    return ZERO_DURATION;
  }

  const totalSeconds = Math.round(durationMs / MS_PER_SECOND);
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;
  return `${pad(minutes)}:${pad(seconds)}`;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}
