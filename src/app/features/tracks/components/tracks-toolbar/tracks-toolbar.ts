import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { SortDirection } from '../../domain/domain.enums';
import { TracksStore } from '../../store/tracks-store';

/** Filter, how many tracks were found, the order of the list, and the way to the ISRCs that are not in the database. */
@Component({
  selector: 'orp-tracks-toolbar',
  imports: [IconField, InputIcon, InputText, TranslocoPipe],
  templateUrl: './tracks-toolbar.html',
  styleUrl: './tracks-toolbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TracksToolbar {
  protected readonly store = inject(TracksStore);

  private readonly _missingTrigger = viewChild<ElementRef<HTMLElement>>('missingTrigger');
  private readonly _filterInput = viewChild<ElementRef<HTMLInputElement>>('filterInput');

  /** What the visitor typed to filter the list by track title or ISRC (two-way). */
  public readonly query = model('');
  /** How many entries the filter lets through. */
  public readonly visibleCount = input.required<number>();
  /** The visitor asked for the list of ISRCs that are not in the database. */
  public readonly missingRequested = output<void>();

  /** Whether the visitor is filtering: the summary then counts the list the filter shows. */
  protected readonly filtering = computed(() => this.query().trim() !== '');

  /** Translation key of the button that reverses the order: it names the order the list is in now. */
  protected readonly sortLabelKey = computed(() =>
    this.store.direction() === SortDirection.ASC ? 'list.sortAsc' : 'list.sortDesc',
  );
  protected readonly sortIcon = computed(() =>
    this.store.direction() === SortDirection.ASC
      ? 'pi pi-sort-alpha-down'
      : 'pi pi-sort-alpha-down-alt',
  );
  /** Said to screen readers when the order changes (the button's own text is not a live region). */
  protected readonly sortAnnouncementKey = computed(() =>
    this.store.direction() === SortDirection.ASC ? 'list.sortedAsc' : 'list.sortedDesc',
  );

  /** Clears the filter and keeps the focus in the field: the button that was used goes away with the text. */
  public clearQuery(): void {
    this.query.set('');
    this._filterInput()?.nativeElement.focus();
  }

  /** The list of missing ISRCs closed: the focus goes back to the button that opened it. */
  public focusMissingTrigger(): void {
    this._missingTrigger()?.nativeElement.focus();
  }

  protected onQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }
}
