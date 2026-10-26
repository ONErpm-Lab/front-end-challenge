import { Injectable, signal } from '@angular/core';
import { Track } from '../../../../contract/tracks.interfaces';

/**
 * The one track being previewed, shared by the cards (which ask to play) and the player bar (which plays).
 * Only one embed exists at a time: choosing another track replaces it, closing the bar stops it.
 */
@Injectable({ providedIn: 'root' })
export class NowPlaying {
  private readonly _track = signal<Track | null>(null);
  private _opener: HTMLElement | null = null;

  public readonly track = this._track.asReadonly();

  /** `opener` is the control that asked, so the focus can go back to it when the player is closed. */
  public play(track: Track, opener: HTMLElement | null = null): void {
    this._opener = opener;
    this._track.set(track);
  }

  public stop(): void {
    const opener = this._opener;
    this._opener = null;
    this._track.set(null);
    if (opener?.isConnected) {
      opener.focus();
    }
  }
}
