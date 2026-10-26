import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  untracked,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { CopyButtonComponent } from '../../../../shared/components/copy-button/copy-button.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { formatDuration } from '../../domain/format-duration';
import { formatReleaseDate } from '../../domain/format-release-date';
import { NowPlayingService } from '../../store/now-playing.service';
import { TracksStore } from '../../store/tracks.store';
import { ReleaseDatesComponent } from '../release-dates/release-dates.component';
import { SpotifyPreviewComponent } from '../spotify-preview/spotify-preview.component';
import { TrackCoverComponent } from '../track-cover/track-cover.component';

/**
 * Everything about the track in focus: cover, availability, the audio preview, its data and the way to Spotify.
 * A panel beside the table on wide screens, the content of a bottom sheet on phones (`sheet`). Picking another
 * track stops the preview: only the track on screen ever plays.
 */
@Component({
  selector: 'orp-track-detail',
  imports: [
    TranslocoPipe,
    IconComponent,
    CopyButtonComponent,
    TrackCoverComponent,
    SpotifyPreviewComponent,
    ReleaseDatesComponent,
  ],
  templateUrl: './track-detail.component.html',
  styleUrl: './track-detail.component.scss',
  host: { '[class.sheet]': 'sheet()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrackDetailComponent {
  private readonly _store = inject(TracksStore);
  private readonly _nowPlaying = inject(NowPlayingService);
  private readonly _i18n = inject(I18nService);

  /** Shown inside the bottom sheet: compact layout and a close button. */
  public readonly sheet = input(false);
  /** Id of the heading, so a dialog can be named by it. */
  public readonly headingId = input('track-detail-title');
  public readonly closed = output<void>();

  protected readonly track = this._store.selected;
  protected readonly artists = computed(() => this.track()?.artists.join(', ') ?? '');
  protected readonly released = computed(() => {
    const track = this.track();
    return track ? formatReleaseDate(track.releaseDate, this._i18n.locale()) : '';
  });
  protected readonly duration = computed(() => formatDuration(this.track()?.durationMs ?? 0));
  protected readonly playing = computed(() => {
    const track = this.track();
    return track !== null && this._nowPlaying.track()?.id === track.id;
  });

  constructor() {
    effect(() => {
      const track = this.track();
      untracked(() => {
        const current = this._nowPlaying.track();
        if (current && current.id !== track?.id) {
          this._nowPlaying.stop(false);
        }
      });
    });
  }

  protected listen(opener: HTMLElement): void {
    const track = this.track();
    if (track) {
      this._nowPlaying.play(track, opener);
    }
  }

  protected closePlayer(): void {
    this._nowPlaying.stop(false);
  }
}
