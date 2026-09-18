import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type AlertTone = 'error' | 'warning' | 'info';

/**
 * Presentational alert. Knows how to look like a message and nothing else — no
 * injected services, no knowledge of Spotify, so any feature can reuse it.
 */
@Component({
  selector: 'onerpm-alert',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="flex items-start gap-3 rounded-lg border p-4 text-sm"
      [class]="toneClasses[tone()]"
      role="alert"
      aria-live="assertive"
    >
      <div class="flex-1">
        <p class="font-semibold">{{ title() }}</p>
        @if (message()) {
          <p class="mt-1 opacity-90">{{ message() }}</p>
        }
      </div>
    </div>
  `,
})
export class Alert {
  readonly title = input.required<string>();
  readonly message = input<string>();
  readonly tone = input<AlertTone>('error');

  protected readonly toneClasses: Record<AlertTone, string> = {
    error: 'border-red-300 bg-red-50 text-red-900',
    warning: 'border-amber-300 bg-amber-50 text-amber-900',
    info: 'border-sky-300 bg-sky-50 text-sky-900',
  };
}
