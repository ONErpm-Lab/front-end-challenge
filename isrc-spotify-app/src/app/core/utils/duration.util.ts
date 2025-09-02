export function formatDuration(durationMs: number): string {
  if (!durationMs || durationMs <= 0) {
    return '0:00';
  }

  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function durationToMinutes(durationMs: number): number {
  if (!durationMs || durationMs <= 0) {
    return 0;
  }

  return Math.round((durationMs / 1000 / 60) * 100) / 100;
}
