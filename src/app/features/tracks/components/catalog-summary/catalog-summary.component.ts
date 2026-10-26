import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { CatalogSummary as Summary } from '../../domain/domain.interfaces';
import { formatDuration } from '../../domain/format-duration';

const BAR_MAX_REM = 3.5;

/** The summary cards above the table: counts, total duration and the releases per year. */
@Component({
  selector: 'orp-catalog-summary',
  imports: [TranslocoPipe],
  templateUrl: './catalog-summary.component.html',
  styleUrl: './catalog-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogSummaryComponent {
  public readonly summary = input.required<Summary>();
  /** Shows placeholders while the lookup runs. */
  public readonly loading = input(false);

  protected readonly duration = computed(() => formatDuration(this.summary().totalDurationMs));
  protected readonly foundPercent = computed(() => {
    const { found, total } = this.summary();
    return total === 0 ? 0 : Math.round((found / total) * 100);
  });
  protected readonly foundRatio = computed(() => this.foundPercent() / 100);
  protected readonly years = computed(() => {
    const years = this.summary().releasesByYear;
    const max = Math.max(1, ...years.map((year) => year.count));
    return years.map((year) => ({ ...year, height: (year.count / max) * BAR_MAX_REM }));
  });
}
