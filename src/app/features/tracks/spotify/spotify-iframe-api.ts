import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { SpotifyIframeApiObject, SpotifyWindow } from './spotify.interfaces';
import { SPOTIFY_IFRAME_API_TIMEOUT_MS, SPOTIFY_IFRAME_API_URL } from './spotify.constants';

/**
 * Spotify's official iFrame API: the only way to start the embedded player by code (an embed URL has no
 * autoplay), so a click on "listen" can begin the music. The script is third-party, so it is added to the page
 * only when the visitor first asks to listen, never at page load, and only from Spotify's own address.
 */
@Injectable({ providedIn: 'root' })
export class SpotifyIframeApi {
  private readonly _document = inject(DOCUMENT);
  private _api: Promise<SpotifyIframeApiObject> | null = null;

  /**
   * Loads the script once; every caller shares the same answer. Rejects (and may be retried) if it cannot
   * load, or does not answer in time: a blocked or stalled script must not leave the player waiting forever.
   */
  public load(): Promise<SpotifyIframeApiObject> {
    this._api ??= new Promise<SpotifyIframeApiObject>((resolve, reject) => {
      const script = this._document.createElement('script');
      const giveUp = (reason: string) => {
        clearTimeout(timer);
        script.remove();
        this._api = null;
        reject(new Error(`Spotify iFrame API could not be loaded: ${reason}`));
      };
      const timer = setTimeout(() => giveUp('no answer in time'), SPOTIFY_IFRAME_API_TIMEOUT_MS);
      (this._document.defaultView as SpotifyWindow).onSpotifyIframeApiReady = (api) => {
        clearTimeout(timer);
        resolve(api);
      };
      script.src = SPOTIFY_IFRAME_API_URL;
      script.async = true;
      script.onerror = () => giveUp('script error');
      this._document.head.appendChild(script);
    });
    return this._api;
  }
}
