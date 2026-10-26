import { signal } from '@angular/core';
import { isSpotifyLocale } from './spotify-embed';
import { SpotifyIframeApiService } from '../../api/spotify-player/spotify-iframe-api.service';
import { SPOTIFY_EMBED_HEIGHT, SPOTIFY_EMBED_READY_TIMEOUT_MS } from './spotify-player.constants';
import { SpotifyEmbedEvent } from '../../api/spotify-player/spotify-player.enums';
import { SpotifyPlayerState } from './spotify-player.enums';
import {
  SpotifyEmbedController,
  SpotifyWindow,
} from '../../api/spotify-player/spotify-player.interfaces';

/**
 * Drives Spotify's embedded player through the iFrame API, so a click can start the music. It is one small state
 * machine (`SpotifyPlayerState`): `IDLE` → `STARTING` → `READY`, or `FAILED` when the script or the embed fails or
 * stalls past a deadline (the page then shows the plain embed). What the visitor wants is only ever "this URI in this
 * mount point": asking again while a step is under way just changes the URI, and the newest one wins.
 *
 * Every answer that can arrive late (the script, the embed, its "ready") carries the number of the start it belongs
 * to (`_run`); `stop()` and a failure bump it, so anything from an older start is ignored (and an embed that comes
 * late is destroyed).
 */
export class SpotifyEmbedPlayer {
  private readonly _state = signal(SpotifyPlayerState.IDLE);
  private _controller: SpotifyEmbedController | null = null;
  private _mount: HTMLElement | null = null;
  private _wantedUri: string | null = null;
  private _title = '';
  private _locale: string | null = null;
  private _run = 0;
  private _deadline: ReturnType<typeof setTimeout> | null = null;

  public readonly state = this._state.asReadonly();

  constructor(
    private readonly _api: SpotifyIframeApiService,
    private readonly _readyTimeoutMs = SPOTIFY_EMBED_READY_TIMEOUT_MS,
  ) {}

  /** Plays `uri` in `mount`: starts the player, or swaps the track of the one that exists (which starts it too). */
  public play(uri: string, mount: HTMLElement): void {
    this._wantedUri = uri;
    this._mount = mount;
    if (this._controller) {
      this._controller.loadUri(uri);
    } else if (this._state() === SpotifyPlayerState.IDLE) {
      this._start();
    }
  }

  /** Takes everything down, forgets a failure, and makes every answer still on its way be ignored. */
  public stop(): void {
    this._wantedUri = null;
    this._mount = null;
    this._release();
    this._state.set(SpotifyPlayerState.IDLE);
  }

  /**
   * The language of the embed (`pt-BR`), for the embeds made from now on: Spotify's script reads it when it makes one,
   * so an embed that already exists keeps its language until the player is stopped and started again.
   */
  public setLocale(locale: string): void {
    this._locale = isSpotifyLocale(locale) ? locale : null;
  }

  /** The accessible name of the embed's frame (it follows the language and the track). */
  public setTitle(title: string): void {
    this._title = title;
    this._applyTitle();
  }

  private _start(): void {
    const mount = this._mount;
    const uri = this._wantedUri;
    if (!mount || !uri) {
      return;
    }
    this._state.set(SpotifyPlayerState.STARTING);
    const run = this._begin();

    this._api
      .load()
      .then((api) => {
        if (run !== this._run) {
          return; // stopped (or given up on) while the script was loading
        }
        this._applyLocale(mount);
        // The embed replaces the element it is given: give it a slot, so our own mount point stays.
        const slot = mount.ownerDocument.createElement('div');
        mount.appendChild(slot);
        api.createController(
          slot,
          { uri, width: '100%', height: SPOTIFY_EMBED_HEIGHT },
          (controller) => this._adopt(controller, uri, mount, run),
        );
      })
      .catch(() => {
        // Only a start still wanted counts as a failure: one that fails after a stop says nothing about the next.
        if (run === this._run) {
          this._fail();
        }
      });
  }

  private _adopt(
    controller: SpotifyEmbedController,
    createdFor: string,
    mount: HTMLElement,
    run: number,
  ): void {
    if (run !== this._run) {
      controller.destroy(); // arrived after a stop, or after the deadline
      return;
    }
    if (!mount.isConnected) {
      // Stopped and asked again meanwhile: the page has a new mount point, so start over there.
      controller.destroy();
      this._state.set(SpotifyPlayerState.IDLE);
      this._start();
      return;
    }
    this._controller = controller;
    controller.addListener(SpotifyEmbedEvent.READY, () => {
      if (run !== this._run) {
        return;
      }
      this._clearDeadline();
      this._state.set(SpotifyPlayerState.READY);
      this._applyTitle();
      controller.play();
    });
    if (this._wantedUri !== null && this._wantedUri !== createdFor) {
      controller.loadUri(this._wantedUri); // another track was chosen meanwhile
    }
  }

  /** Starts a run with its deadline: whichever step stalls, the plain embed takes over when it expires. */
  private _begin(): number {
    this._release();
    const run = this._run;
    this._deadline = setTimeout(() => {
      if (run === this._run) {
        this._fail();
      }
    }, this._readyTimeoutMs);
    return run;
  }

  /** Takes down whatever was started, and makes every answer from the run that ends here be ignored. */
  private _release(): void {
    this._run++;
    this._clearDeadline();
    this._controller?.destroy();
    this._controller = null;
  }

  private _fail(): void {
    this._release();
    this._state.set(SpotifyPlayerState.FAILED);
  }

  private _clearDeadline(): void {
    if (this._deadline !== null) {
      clearTimeout(this._deadline);
      this._deadline = null;
    }
  }

  /** Spotify's script makes the embed in the language it finds in `SpotifyIframeConfig` (else the browser's). */
  private _applyLocale(mount: HTMLElement): void {
    const config = (mount.ownerDocument.defaultView as SpotifyWindow | null)?.SpotifyIframeConfig;
    if (config && this._locale !== null) {
      config.locale = this._locale;
    }
  }

  private _applyTitle(): void {
    const frame = this._mount?.querySelector('iframe');
    if (frame) {
      frame.title = this._title;
    }
  }
}
