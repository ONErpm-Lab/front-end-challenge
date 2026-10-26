import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { Track } from '../../../../../contract/tracks.interfaces';
import { ActionButton } from '../../../../shared/action-button/action-button';
import { ActionIcon } from '../../../../shared/action-button/action-button.enums';
import { NowPlaying } from '../../store/now-playing';
import { buildEmbedUrl } from '../../spotify/spotify-embed';

/**
 * The "listen" control of a card. It does not load anything from Spotify: it asks the player bar to play
 * this track, so ten tracks never mean ten embeds, and the track playing is marked in its own card.
 */
@Component({
  selector: 'orp-track-player',
  imports: [ActionButton, TranslocoPipe],
  templateUrl: './track-player.html',
  styleUrl: './track-player.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrackPlayer {
  public readonly track = input.required<Track>();

  private readonly _nowPlaying = inject(NowPlaying);
  private readonly _host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** The id was not a Spotify id: there is nothing safe to embed, so no player is offered. */
  protected readonly available = computed(() => buildEmbedUrl(this.track().id, false) !== null);

  /** This card's track is the one in the player bar. */
  protected readonly current = computed(() => this._nowPlaying.track()?.id === this.track().id);
  protected readonly icon = computed(() =>
    this.current() ? ActionIcon.EQUALIZER : ActionIcon.PLAY,
  );
  protected readonly labelKey = computed(() =>
    this.current() ? 'tracks.nowPlaying' : 'tracks.listen',
  );

  /** Also called by the play button over the cover: the focus later returns to this card's own button. */
  public play(): void {
    this._nowPlaying.play(this.track(), this._host.nativeElement.querySelector('button'));
  }
}
