import { SpotifyEmbedEvent } from './spotify-player.enums';

/** What the page uses of the controller Spotify's iFrame API returns for an embedded player. */
export interface SpotifyEmbedController {
  loadUri(uri: string): void;
  play(): void;
  destroy(): void;
  addListener(event: SpotifyEmbedEvent, listener: () => void): void;
}

export interface SpotifyEmbedOptions {
  readonly uri: string;
  readonly width: string;
  readonly height: number;
}

/** The API object Spotify's script hands to `onSpotifyIframeApiReady`. */
export interface SpotifyIframeApiObject {
  /** Replaces `element` with the player and calls back with its controller. */
  createController(
    element: HTMLElement,
    options: SpotifyEmbedOptions,
    callback: (controller: SpotifyEmbedController) => void,
  ): void;
}

/** What Spotify's script reads from the page when it makes an embed (it creates the object itself). */
export interface SpotifyIframeConfig {
  /** The language of the embed, as a tag its `?locale=` takes (`pt-BR`). */
  locale?: string;
}

/** The window, with the hook Spotify's script calls once it is ready, and its settings. */
export interface SpotifyWindow extends Window {
  onSpotifyIframeApiReady?: (api: SpotifyIframeApiObject) => void;
  SpotifyIframeConfig?: SpotifyIframeConfig;
}
