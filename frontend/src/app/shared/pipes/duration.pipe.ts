import { Pipe, type PipeTransform } from '@angular/core';

/** Converte milissegundos em mm:ss (ex.: 215000 → "03:35"). */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '--:--';
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

@Pipe({ name: 'duration' })
export class DurationPipe implements PipeTransform {
  transform(ms: number): string {
    return formatDuration(ms);
  }
}
