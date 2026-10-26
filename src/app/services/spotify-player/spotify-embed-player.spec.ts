import { SpotifyEmbedPlayer } from './spotify-embed-player';
import { SpotifyIframeApiService } from '../../api/spotify-player/spotify-iframe-api.service';
import { SpotifyEmbedEvent } from '../../api/spotify-player/spotify-player.enums';
import { SpotifyPlayerState } from './spotify-player.enums';
import {
  SpotifyEmbedController,
  SpotifyEmbedOptions,
  SpotifyIframeApiObject,
} from '../../api/spotify-player/spotify-player.interfaces';

const A = 'spotify:track:7q7QtMiK9jhob0Md7p715D';
const B = 'spotify:track:1A2b3C4d5E6f7G8h9I0j1K';
const TIMEOUT = 1000;

class FakeController implements SpotifyEmbedController {
  public readonly calls: string[] = [];
  public destroyed = false;
  private _ready: (() => void) | null = null;

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
    if (event === SpotifyEmbedEvent.READY) {
      this._ready = listener;
    }
  }
  public becomeReady(): void {
    this._ready?.();
  }
}

/** The script and the embed answer only when the test says so, to reproduce every order of arrival. */
function setup() {
  const controllers: FakeController[] = [];
  const created: { element: HTMLElement; options: SpotifyEmbedOptions }[] = [];
  const answers: ((controller: FakeController) => void)[] = [];
  let scriptReady!: (api: SpotifyIframeApiObject) => void;
  let scriptFails!: (error: Error) => void;

  const api: SpotifyIframeApiObject = {
    createController: (element, options, callback) => {
      created.push({ element, options });
      answers.push((controller) => {
        controllers.push(controller);
        callback(controller);
      });
    },
  };
  const load = vi.fn(
    () =>
      new Promise<SpotifyIframeApiObject>((resolve, reject) => {
        scriptReady = resolve;
        scriptFails = reject;
      }),
  );
  const player = new SpotifyEmbedPlayer({ load } as unknown as SpotifyIframeApiService, TIMEOUT);
  const mount = document.createElement('div');
  document.body.append(mount);

  return {
    player,
    mount,
    load,
    created,
    controllers,
    loadScript: async () => {
      scriptReady(api);
      await Promise.resolve();
      await Promise.resolve();
    },
    failScript: async () => {
      scriptFails(new Error('blocked'));
      await Promise.resolve();
      await Promise.resolve();
    },
    answerEmbed: (index = answers.length - 1) => answers[index](new FakeController()),
  };
}

describe('SpotifyEmbedPlayer', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    document.body.replaceChildren();
  });

  it('is idle, and asks Spotify for nothing, until a track is played', () => {
    const { player, load } = setup();

    expect(player.state()).toBe(SpotifyPlayerState.IDLE);
    expect(load).not.toHaveBeenCalled();
  });

  it('goes from starting to ready, and starts the music once the embed says so', async () => {
    const { player, mount, loadScript, answerEmbed, controllers, created } = setup();

    player.play(A, mount);
    expect(player.state()).toBe(SpotifyPlayerState.STARTING);
    await loadScript();
    answerEmbed();
    controllers[0].becomeReady();

    expect(created[0].options).toEqual({ uri: A, width: '100%', height: 80 });
    expect(created[0].element.parentElement).toBe(mount);
    expect(player.state()).toBe(SpotifyPlayerState.READY);
    expect(controllers[0].calls).toEqual(['play']);
  });

  it('swaps the track of the player that exists, which starts it too', async () => {
    const { player, mount, loadScript, answerEmbed, controllers } = setup();
    player.play(A, mount);
    await loadScript();
    answerEmbed();
    controllers[0].becomeReady();

    player.play(B, mount);
    controllers[0].becomeReady();

    expect(controllers[0].calls).toEqual(['play', `loadUri ${B}`, 'play']);
    expect(player.state()).toBe(SpotifyPlayerState.READY);
  });

  describe('when another track is chosen while a step is under way', () => {
    it('plays the newest one when the script was still loading', async () => {
      const { player, mount, load, loadScript, answerEmbed, controllers, created } = setup();
      player.play(A, mount);

      player.play(B, mount);
      await loadScript();
      answerEmbed();

      expect(load).toHaveBeenCalledTimes(1);
      expect(created).toHaveLength(1);
      expect(created[0].options.uri).toBe(A);
      expect(controllers[0].calls).toEqual([`loadUri ${B}`]);
    });

    it('plays the newest one when the embed was still being made', async () => {
      const { player, mount, loadScript, answerEmbed, controllers } = setup();
      player.play(A, mount);
      await loadScript();

      player.play(B, mount);
      answerEmbed();

      expect(controllers[0].calls).toEqual([`loadUri ${B}`]);
    });
  });

  describe('stopping', () => {
    it('takes the embed down and goes back to idle', async () => {
      const { player, mount, loadScript, answerEmbed, controllers } = setup();
      player.play(A, mount);
      await loadScript();
      answerEmbed();
      controllers[0].becomeReady();

      player.stop();

      expect(controllers[0].destroyed).toBe(true);
      expect(player.state()).toBe(SpotifyPlayerState.IDLE);
    });

    it('ignores a script that arrives after the stop, and starts clean for the next track', async () => {
      const { player, mount, load, loadScript, created } = setup();
      player.play(A, mount);
      player.stop();

      await loadScript();
      expect(created).toHaveLength(0);

      player.play(B, mount);
      expect(load).toHaveBeenCalledTimes(2);
      expect(player.state()).toBe(SpotifyPlayerState.STARTING);
    });

    it('destroys an embed that arrives after the stop', async () => {
      const { player, mount, loadScript, answerEmbed, controllers } = setup();
      player.play(A, mount);
      await loadScript();
      player.stop();

      answerEmbed();

      expect(controllers[0].destroyed).toBe(true);
      expect(player.state()).toBe(SpotifyPlayerState.IDLE);
    });

    it('does not count a script failure that comes after the stop', async () => {
      const { player, mount, failScript } = setup();
      player.play(A, mount);
      player.stop();

      await failScript();

      expect(player.state()).toBe(SpotifyPlayerState.IDLE);
    });

    it('starts over in the new mount point when the embed arrives after a stop and a new play', async () => {
      const { player, mount, loadScript, answerEmbed, controllers, created } = setup();
      player.play(A, mount);
      await loadScript();
      const first = created.length;
      // The bar was closed (its mount point is gone) and reopened, with another mount point, before the embed answered.
      const newMount = document.createElement('div');
      document.body.append(newMount);
      mount.remove();
      player.play(B, newMount);

      answerEmbed();

      expect(first).toBe(1);
      expect(controllers[0].destroyed).toBe(true);
      expect(player.state()).toBe(SpotifyPlayerState.STARTING);
    });
  });

  describe('when it fails', () => {
    it('is failed when the script cannot be loaded, and leaves the plain embed alone to follow the track', async () => {
      const { player, mount, load, failScript } = setup();
      player.play(A, mount);

      await failScript();
      player.play(B, mount);

      expect(player.state()).toBe(SpotifyPlayerState.FAILED);
      expect(load).toHaveBeenCalledTimes(1);
    });

    it('tries the script again after a stop', async () => {
      const { player, mount, load, failScript } = setup();
      player.play(A, mount);
      await failScript();

      player.stop();
      player.play(A, mount);

      expect(player.state()).toBe(SpotifyPlayerState.STARTING);
      expect(load).toHaveBeenCalledTimes(2);
    });

    it('gives up when the embed never answers, and when it never says it is ready', async () => {
      const first = setup();
      first.player.play(A, first.mount);
      await first.loadScript();

      vi.advanceTimersByTime(TIMEOUT);
      expect(first.player.state()).toBe(SpotifyPlayerState.FAILED);

      const second = setup();
      second.player.play(A, second.mount);
      await second.loadScript();
      second.answerEmbed();

      vi.advanceTimersByTime(TIMEOUT);
      expect(second.player.state()).toBe(SpotifyPlayerState.FAILED);
      expect(second.controllers[0].destroyed).toBe(true);
    });

    it('destroys an embed that answers after the deadline', async () => {
      const { player, mount, loadScript, answerEmbed, controllers } = setup();
      player.play(A, mount);
      await loadScript();
      vi.advanceTimersByTime(TIMEOUT);

      answerEmbed();

      expect(controllers[0].destroyed).toBe(true);
      expect(player.state()).toBe(SpotifyPlayerState.FAILED);
    });

    it('does not give up once the embed is ready, nor after a stop', async () => {
      const { player, mount, loadScript, answerEmbed, controllers } = setup();
      player.play(A, mount);
      await loadScript();
      answerEmbed();
      controllers[0].becomeReady();

      vi.advanceTimersByTime(TIMEOUT * 5);

      expect(player.state()).toBe(SpotifyPlayerState.READY);

      player.stop();
      vi.advanceTimersByTime(TIMEOUT * 5);
      expect(player.state()).toBe(SpotifyPlayerState.IDLE);
    });
  });

  describe('the language of the embed', () => {
    const config: { locale?: string } = {};
    beforeEach(() => {
      delete config.locale;
      Object.defineProperty(window, 'SpotifyIframeConfig', { configurable: true, value: config });
    });
    afterEach(() => Reflect.deleteProperty(window, 'SpotifyIframeConfig'));

    it('is given to the script of Spotify before it makes the embed', async () => {
      const { player, mount, loadScript, created } = setup();
      player.setLocale('pt-BR');
      player.play(A, mount);

      expect(config.locale).toBeUndefined();
      await loadScript();

      expect(created).toHaveLength(1);
      expect(config.locale).toBe('pt-BR');
    });

    it('is the newest one when it changes while the script loads', async () => {
      const { player, mount, loadScript } = setup();
      player.setLocale('en');
      player.play(A, mount);

      player.setLocale('fr');
      await loadScript();

      expect(config.locale).toBe('fr');
    });

    it.each([[''], ['pt_BR'], ['../x'], ['pt-BR&x=1']])(
      'is not given when it is not a language tag (%j)',
      async (locale) => {
        const { player, mount, loadScript } = setup();
        player.setLocale(locale);
        player.play(A, mount);

        await loadScript();

        expect(config.locale).toBeUndefined();
      },
    );

    it('does not fail when the script of Spotify left no settings in the page', async () => {
      Reflect.deleteProperty(window, 'SpotifyIframeConfig');
      const { player, mount, loadScript, created } = setup();
      player.setLocale('es');
      player.play(A, mount);

      await loadScript();

      expect(created).toHaveLength(1);
    });
  });

  describe('the title of the frame', () => {
    it('is written to the frame of the embed once it is ready, and follows later changes', async () => {
      const { player, mount, loadScript, answerEmbed, controllers } = setup();
      const frame = document.createElement('iframe');
      player.setTitle('Playing Louca');
      player.play(A, mount);
      await loadScript();
      mount.appendChild(frame);
      answerEmbed();

      controllers[0].becomeReady();
      expect(frame.title).toBe('Playing Louca');

      player.setTitle('Tocando Louca');
      expect(frame.title).toBe('Tocando Louca');
    });
  });
});
