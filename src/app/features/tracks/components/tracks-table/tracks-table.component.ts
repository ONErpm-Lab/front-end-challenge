import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LookupStatus } from '../../../../models/tracks.enums';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { formatDuration } from '../../domain/format-duration';
import { formatReleaseDate } from '../../domain/format-release-date';
import { TracksStore } from '../../store/tracks.store';
import { TrackCoverComponent } from '../track-cover/track-cover.component';
import { TrackPick } from './tracks-table.interfaces';

const SKELETON_ROWS = [1, 2, 3, 4, 5, 6];

/**
 * The tracks as a table, in the order and with the filters of the store. Picking a track (its title is the
 * button) puts it in the detail panel; ISRCs without a track stay in the list, after the tracks.
 */
@Component({
  selector: 'orp-tracks-table',
  imports: [TranslocoPipe, IconComponent, TrackCoverComponent],
  templateUrl: './tracks-table.component.html',
  styleUrl: './tracks-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TracksTableComponent {
  protected readonly store = inject(TracksStore);
  private readonly _i18n = inject(I18nService);

  /** The visitor picked a track: its ISRC and the button they used (to give the focus back later). */
  public readonly picked = output<TrackPick>();

  protected readonly skeleton = SKELETON_ROWS;
  protected readonly lookupStatus = LookupStatus;

  protected readonly rows = computed(() => {
    const locale = this._i18n.locale();
    const selected = this.store.selected()?.isrc ?? null;
    return this.store.visibleItems().map((result) =>
      result.status === LookupStatus.FOUND
        ? {
            result,
            track: result.track,
            artists: result.track.artists.join(', '),
            released: formatReleaseDate(result.track.releaseDate, locale),
            duration: formatDuration(result.track.durationMs),
            selected: result.isrc === selected,
          }
        : { result, track: null, artists: '', released: '', duration: '', selected: false },
    );
  });

  protected readonly query = computed(() => this.store.query().trim());

  protected pick(isrc: string, opener: HTMLElement): void {
    this.store.select(isrc);
    this.picked.emit({ isrc, opener });
  }
}
