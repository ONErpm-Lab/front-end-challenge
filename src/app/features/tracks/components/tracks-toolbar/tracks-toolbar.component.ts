import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { SortDirection, StatusFilter } from '../../domain/domain.enums';
import { TracksStore } from '../../store/tracks.store';

/** Above the table: the text filter, the status chips (with their counts) and the order by title. */
@Component({
  selector: 'orp-tracks-toolbar',
  imports: [TranslocoPipe, IconComponent],
  templateUrl: './tracks-toolbar.component.html',
  styleUrl: './tracks-toolbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TracksToolbarComponent {
  protected readonly store = inject(TracksStore);

  protected readonly chips = computed(() => {
    const summary = this.store.summary();
    const current = this.store.statusFilter();
    return [
      { id: StatusFilter.ALL, label: 'list.all', count: summary.total },
      { id: StatusFilter.AVAILABLE_BR, label: 'list.availableBR', count: summary.availableInBR },
      {
        id: StatusFilter.UNAVAILABLE_BR,
        label: 'list.unavailableBR',
        count: summary.unavailableInBR,
      },
      { id: StatusFilter.NOT_FOUND, label: 'list.notFound', count: summary.notFound },
    ].map((chip) => ({ ...chip, pressed: chip.id === current }));
  });

  protected readonly descending = computed(() => this.store.direction() === SortDirection.DESC);

  protected onInput(event: Event): void {
    this.store.setQuery((event.target as HTMLInputElement).value);
  }

  protected clear(input: HTMLInputElement): void {
    this.store.setQuery('');
    input.focus();
  }
}
