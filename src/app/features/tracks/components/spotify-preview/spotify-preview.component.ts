import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { TranslocoPipe, translateSignal } from '@jsverse/transloco';
import { Track } from '../../../../models/tracks.interfaces';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { ThemeService } from '../../../../core/theme/theme.service';
import { buildEmbedUrl, buildTrackUri } from '../../../../services/spotify-player/spotify-embed';
import { SpotifyPlayerService } from '../../../../services/spotify-player/spotify-player.service';
import { SpotifyPlayerState } from '../../../../services/spotify-player/spotify-player.enums';
import {
  SPOTIFY_EMBED_HEIGHT,
  SPOTIFY_EMBED_URL,
} from '../../../../services/spotify-player/spotify-player.constants';

/**
 * Audio preview through Spotify's official embed (the API gives no `preview_url`). It exists only while the
 * visitor listens: created by the "listen" button, it loads Spotify's iFrame API and starts the music by itself
 * (`SpotifyEmbedPlayer`). If that cannot be done (script blocked, offline, a step stalls), the plain embed takes
 * over and the visitor presses play in it.
 */
@Component({
  selector: 'orp-spotify-preview',
  templateUrl: './spotify-preview.component.html',
  styleUrl: './spotify-preview.component.scss',
  imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpotifyPreviewComponent {
  public readonly track = input.required<Track>();

  private readonly _i18n = inject(I18nService);
  private readonly _theme = inject(ThemeService);
  private readonly _sanitizer = inject(DomSanitizer);
  private readonly _mount = viewChild<ElementRef<HTMLElement>>('mount');
  private readonly _player = inject(SpotifyPlayerService).create();
  /** The address of the fallback frame that has finished loading. */
  private readonly _loadedFallback = signal<string | null>(null);

  protected readonly height = SPOTIFY_EMBED_HEIGHT;
  protected readonly ready = computed(() => this._player.state() === SpotifyPlayerState.READY);
  private readonly _failed = computed(() => this._player.state() === SpotifyPlayerState.FAILED);

  protected readonly playerTitle = translateSignal('tracks.playerTitle', {
    title: computed(() => this.track().title),
  });

  private readonly _fallbackAddress = computed(() =>
    this._failed()
      ? buildEmbedUrl(this.track().id, this._theme.isDark(), this._i18n.locale())
      : null,
  );

  protected readonly fallbackUrl = computed(() => {
    const url = this._fallbackAddress();
    // Trusted because it is our fixed Spotify origin plus an id validated by `buildEmbedUrl`.
    return url ? this._sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });

  /** The visitor has something to play on screen: the embed is ready or, in fallback, its own frame loaded. */
  protected readonly shown = computed(() =>
    this._failed()
      ? this._fallbackAddress() !== null && this._loadedFallback() === this._fallbackAddress()
      : this.ready(),
  );

  constructor() {
    // First, so the language is known when the effect below makes the embed.
    effect(() => this._player.setLocale(this._i18n.locale()));
    effect(() => {
      const uri = buildTrackUri(this.track().id);
      const mount = this._mount();
      untracked(() => {
        if (uri && mount) {
          this._player.play(uri, mount.nativeElement);
        }
      });
    });
    effect(() => this._player.setTitle(this.playerTitle()));
    inject(DestroyRef).onDestroy(() => this._player.stop());
  }

  protected onFallbackLoad(event: Event): void {
    // Some browsers fire an initial `load` for the blank frame, before the embed's address is applied.
    const { src } = event.target as HTMLIFrameElement;
    if (src.startsWith(SPOTIFY_EMBED_URL)) {
      this._loadedFallback.set(src);
    }
  }
}
