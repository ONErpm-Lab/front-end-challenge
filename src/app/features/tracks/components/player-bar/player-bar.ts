import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { TranslocoPipe, translateSignal } from '@jsverse/transloco';
import { I18n } from '../../../../core/i18n/i18n';
import { Theme } from '../../../../core/theme/theme';
import { NowPlaying } from '../../store/now-playing';
import { buildEmbedUrl, buildTrackUri } from '../../spotify/spotify-embed';
import { SpotifyEmbedPlayer } from '../../spotify/spotify-embed-player';
import { SpotifyIframeApi } from '../../spotify/spotify-iframe-api';
import { SpotifyPlayerState } from '../../spotify/spotify.enums';
import { SPOTIFY_EMBED_HEIGHT, SPOTIFY_EMBED_URL } from '../../spotify/spotify.constants';

/**
 * Audio preview through Spotify's official embed (the API gives no `preview_url`, see ADR 0005), in a bar
 * pinned to the bottom of the window: the visitor can pause or skip around while scrolling the other cards,
 * and there is never more than one player. Nothing from Spotify loads until the visitor asks to listen, and
 * then the music starts by itself (through Spotify's iFrame API, driven by `SpotifyEmbedPlayer`). If that cannot
 * be done (script blocked, offline, or a step stalls past a deadline), the plain embed takes over: the visitor
 * presses play in it.
 */
@Component({
  selector: 'orp-player-bar',
  templateUrl: './player-bar.html',
  styleUrl: './player-bar.scss',
  imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerBar {
  private readonly _nowPlaying = inject(NowPlaying);
  private readonly _i18n = inject(I18n);
  private readonly _theme = inject(Theme);
  private readonly _sanitizer = inject(DomSanitizer);
  private readonly _mount = viewChild<ElementRef<HTMLElement>>('mount');
  private readonly _player = new SpotifyEmbedPlayer(inject(SpotifyIframeApi));
  /** The address of the fallback frame that has finished loading (it changes with the track and the theme). */
  private readonly _loadedFallback = signal<string | null>(null);

  protected readonly height = SPOTIFY_EMBED_HEIGHT;
  protected readonly track = this._nowPlaying.track;
  protected readonly ready = computed(() => this._player.state() === SpotifyPlayerState.READY);
  private readonly _failed = computed(() => this._player.state() === SpotifyPlayerState.FAILED);

  /** The name of the frame: for the plain embed it is bound in the template, for Spotify's own the player writes it. */
  protected readonly playerTitle = translateSignal('tracks.playerTitle', {
    title: computed(() => this._nowPlaying.track()?.title ?? ''),
  });

  /** Only when the player could not be started by code: the address of the plain embed of the track. */
  private readonly _fallbackAddress = computed(() => {
    const track = this._nowPlaying.track();
    return this._failed() && track
      ? buildEmbedUrl(track.id, this._theme.isDark(), this._i18n.locale())
      : null;
  });

  protected readonly fallbackUrl = computed(() => {
    const url = this._fallbackAddress();
    // Trusted because it is our fixed Spotify origin plus an id validated by `buildEmbedUrl`.
    return url ? this._sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });

  /** What the visitor has on screen can be played: the embed is ready or, in fallback, its own frame loaded. */
  protected readonly shown = computed(() =>
    this._failed()
      ? this._fallbackAddress() !== null && this._loadedFallback() === this._fallbackAddress()
      : this.ready(),
  );

  constructor() {
    // First, so the language is known when the effect below makes the embed.
    effect(() => this._player.setLocale(this._i18n.locale()));
    effect(() => {
      const track = this._nowPlaying.track();
      const mount = this._mount();
      untracked(() => {
        const uri = track ? buildTrackUri(track.id) : null;
        if (uri === null) {
          // A closed bar forgets a failure: the next track tries Spotify's script again, and a fallback frame loads anew.
          this._player.stop();
          this._loadedFallback.set(null);
        } else if (mount) {
          this._player.play(uri, mount.nativeElement);
        }
      });
    });
    effect(() => this._player.setTitle(this.playerTitle()));
    inject(DestroyRef).onDestroy(() => this._player.stop());
  }

  protected close(): void {
    this._nowPlaying.stop();
  }

  protected onFallbackLoad(event: Event): void {
    // Some browsers fire an initial `load` for the blank frame, before the embed's address is applied.
    const { src } = event.target as HTMLIFrameElement;
    if (src.startsWith(SPOTIFY_EMBED_URL)) {
      this._loadedFallback.set(src);
    }
  }
}
