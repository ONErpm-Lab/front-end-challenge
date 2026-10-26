import { SpotifyIframeApiService } from '../../../api/spotify-player/spotify-iframe-api.service';
import { SpotifyEmbedEvent } from '../../../api/spotify-player/spotify-player.enums';
import {
  SpotifyEmbedController,
  SpotifyEmbedOptions,
  SpotifyIframeApiObject,
} from '../../../api/spotify-player/spotify-player.interfaces';

/** A stand-in for Spotify's controller: it records what the page asks of it and can fire its events. */
export class FakeController implements SpotifyEmbedController {
  public readonly calls: string[] = [];
  public destroyed = false;
  private readonly _listeners = new Map<string, () => void>();

  public loadUri(uri: string): void {
    this.calls.push(`loadUri ${uri}`);
  }
  public play(): void {
    this.calls.push('play');
  }
  public destroy(): void {
    this.destroyed = true;
  }
  public addListener(event: SpotifyEmbedEvent, listener: () => void): void {
    this._listeners.set(event, listener);
  }
  public emit(event: SpotifyEmbedEvent): void {
    this._listeners.get(event)?.();
  }
}

export interface FakeSpotify {
  readonly provider: {
    provide: typeof SpotifyIframeApiService;
    useValue: Pick<SpotifyIframeApiService, 'load'>;
  };
  readonly controllers: FakeController[];
  readonly created: { element: HTMLElement; options: SpotifyEmbedOptions }[];
  readonly load: ReturnType<typeof vi.fn>;
}

/** Spotify's iFrame API, faked: the script "loads" (or fails) and each embed gets a `FakeController`. */
export function fakeSpotify(options: { scriptFails?: boolean } = {}): FakeSpotify {
  const controllers: FakeController[] = [];
  const created: FakeSpotify['created'] = [];
  const api: SpotifyIframeApiObject = {
    createController: (element, creation, callback) => {
      created.push({ element, options: creation });
      const controller = new FakeController();
      controllers.push(controller);
      callback(controller);
    },
  };
  const load = vi.fn(() =>
    options.scriptFails ? Promise.reject(new Error('blocked')) : Promise.resolve(api),
  );
  return {
    provider: { provide: SpotifyIframeApiService, useValue: { load } },
    controllers,
    created,
    load,
  };
}
