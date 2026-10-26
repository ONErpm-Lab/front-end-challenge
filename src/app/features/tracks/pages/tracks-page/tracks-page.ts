import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { Button } from 'primeng/button';
import { Message } from 'primeng/message';
import { Skeleton } from 'primeng/skeleton';
import { LookupStatus } from '../../../../../contract/tracks.enums';
import { filterResults } from '../../domain/filter-results';
import { IsrcCard } from '../../components/isrc-card/isrc-card';
import { IsrcListDialog } from '../../components/isrc-list-dialog/isrc-list-dialog';
import { TrackCard } from '../../components/track-card/track-card';
import { TracksToolbar } from '../../components/tracks-toolbar/tracks-toolbar';
import { UnavailablePanel } from '../../components/unavailable-panel/unavailable-panel';
import { TracksStore } from '../../store/tracks-store';

/** The page: a hero, then the tracks (or why there are none), with a filter and the ISRCs that are missing. */
@Component({
  selector: 'orp-tracks-page',
  imports: [
    Button,
    IsrcCard,
    IsrcListDialog,
    Message,
    Skeleton,
    TrackCard,
    TracksToolbar,
    TranslocoPipe,
    UnavailablePanel,
  ],
  templateUrl: './tracks-page.html',
  styleUrl: './tracks-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TracksPage {
  protected readonly store = inject(TracksStore);

  private readonly _toolbar = viewChild(TracksToolbar);

  /** What the visitor typed to filter the list by track title or ISRC. */
  protected readonly query = signal('');

  /** The results the filter lets through, in display order. */
  protected readonly visibleItems = computed(() => filterResults(this.store.items(), this.query()));

  /** Busy until the lookup has finished, successfully or not: an alert in a busy region may go unannounced. */
  protected readonly busy = computed(() => !this.store.isReady() && !this.store.isUnavailable());

  /** Whether the list of ISRCs that failed is open. */
  protected readonly affectedOpen = signal(false);
  /** Whether the list of ISRCs that are not in the database is open. */
  protected readonly missingOpen = signal(false);

  protected readonly LookupStatus = LookupStatus;
  protected readonly placeholders = [1, 2, 3, 4];

  protected reload(): void {
    this.store.reload();
  }

  protected retryAffected(): void {
    this.affectedOpen.set(false);
    this.store.reload();
  }

  protected clearQuery(): void {
    this._toolbar()?.clearQuery();
  }

  /** The list of missing ISRCs closed: the focus goes back to the button that opened it. */
  protected focusMissingTrigger(): void {
    this._toolbar()?.focusMissingTrigger();
  }
}
