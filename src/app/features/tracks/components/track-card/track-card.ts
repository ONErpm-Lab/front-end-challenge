import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { Tag } from 'primeng/tag';
import { Track } from '../../../../../contract/tracks.interfaces';
import { I18n } from '../../../../core/i18n/i18n';
import { ActionButton } from '../../../../shared/action-button/action-button';
import { ACTION_ICON_PATHS } from '../../../../shared/action-button/action-button.constants';
import { ActionIcon } from '../../../../shared/action-button/action-button.enums';
import { CopyButton } from '../../../../shared/copy-button/copy-button';
import { formatDuration } from '../../domain/format-duration';
import { formatReleaseDate } from '../../domain/format-release-date';
import { NowPlaying } from '../../store/now-playing';
import { buildTrackUri } from '../../spotify/spotify-embed';
import { TrackPlayer } from '../track-player/track-player';

/** One track: cover, title, artists, release date, duration, Brazil availability, player and link. */
@Component({
  selector: 'orp-track-card',
  imports: [ActionButton, CopyButton, Tag, TrackPlayer, TranslocoPipe],
  templateUrl: './track-card.html',
  styleUrl: './track-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrackCard {
  public readonly track = input.required<Track>();

  private readonly _i18n = inject(I18n);
  private readonly _nowPlaying = inject(NowPlaying);
  private readonly _player = viewChild(TrackPlayer);
  private readonly _coverFailed = signal(false);

  protected readonly spotifyIcon = ActionIcon.SPOTIFY;
  protected readonly playPath = ACTION_ICON_PATHS[ActionIcon.PLAY] ?? '';

  /** The play button over the cover is offered for a playable track that is not the one playing already. */
  protected readonly coverPlayable = computed(
    () =>
      buildTrackUri(this.track().id) !== null && this._nowPlaying.track()?.id !== this.track().id,
  );
  protected readonly titleId = computed(() => `track-${this.track().id}`);
  protected readonly artists = computed(() => this.track().artists.join(', '));
  protected readonly released = computed(() =>
    formatReleaseDate(this.track().releaseDate, this._i18n.locale()),
  );
  protected readonly duration = computed(() => formatDuration(this.track().durationMs));

  /** The cover to show, or `null` when there is none or it failed to load (a placeholder takes over). */
  protected readonly coverUrl = computed(() =>
    this._coverFailed() ? null : this.track().coverUrl,
  );

  /** The same action as the "listen" button below, for a click on the cover: it plays this track. */
  protected playFromCover(): void {
    this._player()?.play();
  }

  protected onCoverError(): void {
    this._coverFailed.set(true);
  }
}
