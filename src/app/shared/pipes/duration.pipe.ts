import { Pipe, PipeTransform } from '@angular/core';

/**
 * Milliseconds -> `mm:ss`, as the spec requires.
 *
 * The one and only duration formatter in the app: components render it, they never
 * compute it. Pure, so it also costs nothing to change-detect.
 */
@Pipe({ name: 'duration' })
export class DurationPipe implements PipeTransform {
  transform(milliseconds: number | null | undefined): string {
    if (milliseconds == null || !Number.isFinite(milliseconds) || milliseconds < 0) {
      return '--:--';
    }

    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${pad(minutes)}:${pad(seconds)}`;
  }
}

const pad = (value: number): string => value.toString().padStart(2, '0');
