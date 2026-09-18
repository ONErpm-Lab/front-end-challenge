import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type BadgeTone = 'positive' | 'negative' | 'neutral';

/**
 * Presentational status pill. Used by the tracks feature for BR availability, but
 * it carries no notion of markets or tracks — that stays in the feature.
 */
@Component({
  selector: 'onerpm-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      [class]="toneClasses[tone()]"
    >
      <span class="size-1.5 rounded-full bg-current" aria-hidden="true"></span>
      <ng-content />
    </span>
  `,
})
export class Badge {
  readonly tone = input<BadgeTone>('neutral');

  protected readonly toneClasses: Record<BadgeTone, string> = {
    positive: 'bg-emerald-100 text-emerald-800',
    negative: 'bg-red-100 text-red-800',
    neutral: 'bg-slate-100 text-slate-700',
  };
}
