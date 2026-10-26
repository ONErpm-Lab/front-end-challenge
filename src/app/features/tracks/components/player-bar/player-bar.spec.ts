import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Language } from '../../../../core/i18n/i18n.enums';
import { DARK_MODE_CLASS } from '../../../../core/theme/theme.constants';
import { Theme } from '../../../../core/theme/theme';
import { ThemeMode } from '../../../../core/theme/theme.enums';
import { i18nTestProviders, useLanguage } from '../../../../testing/i18n-testing';
import { NowPlaying } from '../../store/now-playing';
import { SpotifyIframeApi } from '../../spotify/spotify-iframe-api';
import { SpotifyEmbedEvent } from '../../spotify/spotify.enums';
import {
  SpotifyEmbedController,
  SpotifyEmbedOptions,
  SpotifyIframeApiObject,
} from '../../spotify/spotify.interfaces';
import { track } from '../../testing/builders';
import { SPOTIFY_EMBED_READY_TIMEOUT_MS } from '../../spotify/spotify.constants';
import { PlayerBar } from './player-bar';

const ID = '7q7QtMiK9jhob0Md7p715D';
const OTHER_ID = '1A2b3C4d5E6f7G8h9I0j1K';

/** A stand-in for Spotify's controller: it records what the bar asks of it and can fire its events. */
class FakeController implements SpotifyEmbedController {
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

interface Setup {
  /** The callbacks of embeds that were asked for and have not answered (only with `holdControllers`). */
  held: ((controller: FakeController) => void)[];
  fixture: ComponentFixture<PlayerBar>;
  controllers: FakeController[];
  created: { element: HTMLElement; options: SpotifyEmbedOptions }[];
  load: ReturnType<typeof vi.fn>;
}

async function render(
  options: { language?: Language; scriptFails?: boolean; holdControllers?: boolean } = {},
): Promise<Setup> {
  const controllers: FakeController[] = [];
  const created: Setup['created'] = [];
  const held: Setup['held'] = [];
  const api: SpotifyIframeApiObject = {
    createController: (element, creation, callback) => {
      created.push({ element, options: creation });
      if (options.holdControllers) {
        held.push((controller) => {
          controllers.push(controller);
          callback(controller);
        });
        return;
      }
      const controller = new FakeController();
      controllers.push(controller);
      callback(controller);
    },
  };
  const load = vi.fn(() =>
    options.scriptFails ? Promise.reject(new Error('blocked')) : Promise.resolve(api),
  );
  TestBed.configureTestingModule({
    imports: [PlayerBar],
    providers: [...i18nTestProviders, { provide: SpotifyIframeApi, useValue: { load } }],
  });
  await useLanguage(options.language);
  const fixture = TestBed.createComponent(PlayerBar);
  await fixture.whenStable();
  return { fixture, controllers, created, held, load };
}

const root = (fixture: ComponentFixture<PlayerBar>) => fixture.nativeElement as HTMLElement;
const closeButton = (fixture: ComponentFixture<PlayerBar>) =>
  root(fixture).querySelector('button.bar__close') as HTMLButtonElement | null;
const loading = (fixture: ComponentFixture<PlayerBar>) =>
  root(fixture).querySelector('.bar__loading');
const settle = async (fixture: ComponentFixture<PlayerBar>) => {
  await fixture.whenStable();
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
};
const play = async (fixture: ComponentFixture<PlayerBar>, id = ID, title = 'Louca') => {
  TestBed.inject(NowPlaying).play(track({ id, title }));
  await settle(fixture);
};

describe('PlayerBar', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove(DARK_MODE_CLASS);
  });

  describe('before the visitor asks to listen', () => {
    it('is empty, and loads nothing from Spotify, not even its script', async () => {
      const { fixture, load } = await render();

      expect(root(fixture).querySelector('section')).toBeNull();
      expect(load).not.toHaveBeenCalled();
    });
  });

  describe('once a track is chosen', () => {
    it('makes the embedded player for that track, in the slim size and the full width', async () => {
      const { fixture, created } = await render();

      await play(fixture);

      expect(created).toHaveLength(1);
      expect(created[0].options).toEqual({
        uri: `spotify:track:${ID}`,
        width: '100%',
        height: 80,
      });
    });

    it('gives the embed a slot inside its own mount point, which the embed may replace', async () => {
      const { fixture, created } = await render();

      await play(fixture);

      const mount = root(fixture).querySelector('.bar__mount') as HTMLElement;
      expect(created[0].element.parentElement).toBe(mount);
    });

    it('starts the music by itself once the embed says it is ready', async () => {
      const { fixture, controllers } = await render();
      await play(fixture);
      expect(controllers[0].calls).toEqual([]);

      controllers[0].emit(SpotifyEmbedEvent.READY);

      expect(controllers[0].calls).toEqual(['play']);
    });

    it('is a region named "Audio preview" for assistive technology', async () => {
      const { fixture } = await render();

      await play(fixture);

      expect(root(fixture).querySelector('section')?.getAttribute('aria-label')).toBe(
        'Audio preview',
      );
    });

    it('names the frame after the track, in the visitor language, once the embed exists', async () => {
      const { fixture, controllers, created } = await render({ language: Language.PT });
      await play(fixture, ID, 'Quase Nua');
      const frame = document.createElement('iframe');
      (root(fixture).querySelector('.bar__mount') as HTMLElement).replaceChildren(frame);
      controllers[0].emit(SpotifyEmbedEvent.READY);
      await settle(fixture);

      expect(created).toHaveLength(1);
      expect(frame.title).toBe('Player do Spotify para Quase Nua');
    });

    it('swaps the track in the same player when another is chosen, which starts it too', async () => {
      const { fixture, controllers, created } = await render();
      await play(fixture, ID);
      controllers[0].emit(SpotifyEmbedEvent.READY);

      await play(fixture, OTHER_ID);
      controllers[0].emit(SpotifyEmbedEvent.READY);

      expect(created).toHaveLength(1);
      expect(controllers[0].calls).toEqual(['play', `loadUri spotify:track:${OTHER_ID}`, 'play']);
    });

    it('plays the last track chosen when it was chosen while the embed was being made', async () => {
      const { fixture, controllers } = await render();
      TestBed.inject(NowPlaying).play(track({ id: ID }));
      fixture.detectChanges();
      TestBed.inject(NowPlaying).play(track({ id: OTHER_ID }));

      await settle(fixture);

      expect(controllers).toHaveLength(1);
      expect(controllers[0].calls).toContain(`loadUri spotify:track:${OTHER_ID}`);
    });

    it('offers nothing for an id that is not a Spotify id, and asks Spotify for nothing', async () => {
      const { fixture, created } = await render();

      await play(fixture, 'https://evil.example/x');

      expect(created).toHaveLength(0);
    });
  });

  describe('while the embed loads', () => {
    it('holds its place at once, with its height, and says it is loading', async () => {
      const { fixture } = await render();

      await play(fixture);

      expect((root(fixture).querySelector('.bar__stage') as HTMLElement).style.height).toBe('80px');
      expect(loading(fixture)?.getAttribute('role')).toBe('status');
      expect(loading(fixture)?.textContent?.trim()).toBe('Loading the player…');
      expect(root(fixture).querySelector('.bar__mount')?.classList).toContain(
        'bar__mount--pending',
      );
    });

    it('hides the embed that is not ready from the keyboard and assistive technology', () => {
      const styles = readFileSync(
        join(process.cwd(), 'src/app/features/tracks/components/player-bar/player-bar.scss'),
        'utf8',
      );
      const pending = /\.bar__mount--pending[^{]*\{([^}]*)\}/.exec(styles)?.[1] ?? '';

      expect(pending).toContain('visibility: hidden');
      expect(pending).not.toContain('opacity');
    });

    it('says it in the visitor language', async () => {
      const { fixture } = await render({ language: Language.PT });

      await play(fixture);

      expect(loading(fixture)?.textContent?.trim()).toBe('Carregando o player…');
    });

    it('shows the embed and drops the placeholder once Spotify says it is ready', async () => {
      const { fixture, controllers } = await render();
      await play(fixture);

      controllers[0].emit(SpotifyEmbedEvent.READY);
      await settle(fixture);

      expect(loading(fixture)).toBeNull();
      expect(root(fixture).querySelector('.bar__mount')?.classList).not.toContain(
        'bar__mount--pending',
      );
    });
  });

  describe('when Spotify script cannot be loaded (blocked, offline)', () => {
    it('falls back to the plain embed of the track, which the visitor starts', async () => {
      const { fixture } = await render({ scriptFails: true });

      await play(fixture);

      const frame = root(fixture).querySelector('iframe') as HTMLIFrameElement;
      expect(frame.src).toBe(`https://open.spotify.com/embed/track/${ID}?locale=en`);
      expect(frame.getAttribute('allow')).toBe('encrypted-media');
      expect(frame.getAttribute('height')).toBe('80');
    });

    it('keeps the loading indicator, with the frame hidden, until the fallback frame has loaded', async () => {
      const { fixture } = await render({ scriptFails: true });

      await play(fixture);

      expect(loading(fixture)).not.toBeNull();
      expect(root(fixture).querySelector('iframe')?.classList).toContain('bar__frame--pending');

      root(fixture).querySelector('iframe')?.dispatchEvent(new Event('load'));
      await settle(fixture);

      expect(loading(fixture)).toBeNull();
      expect(root(fixture).querySelector('iframe')?.classList).not.toContain('bar__frame--pending');
    });

    it('waits again when the fallback frame is replaced (another track, or another theme)', async () => {
      const { fixture } = await render({ scriptFails: true });
      await play(fixture, ID);
      root(fixture).querySelector('iframe')?.dispatchEvent(new Event('load'));
      await settle(fixture);
      expect(loading(fixture)).toBeNull();

      await play(fixture, OTHER_ID);
      expect(loading(fixture)).not.toBeNull();
      root(fixture).querySelector('iframe')?.dispatchEvent(new Event('load'));
      await settle(fixture);
      expect(loading(fixture)).toBeNull();

      TestBed.inject(Theme).setMode(ThemeMode.DARK);
      await settle(fixture);
      expect(loading(fixture)).not.toBeNull();
    });

    it('waits for the frame again when the bar is closed and the same track is chosen again', async () => {
      const { fixture } = await render({ scriptFails: true });
      await play(fixture, ID);
      root(fixture).querySelector('iframe')?.dispatchEvent(new Event('load'));
      await settle(fixture);
      closeButton(fixture)?.click();
      await settle(fixture);

      await play(fixture, ID);

      expect(loading(fixture)).not.toBeNull();
      expect(root(fixture).querySelector('iframe')?.classList).toContain('bar__frame--pending');
    });

    it('ignores a load of something that is not the Spotify embed', async () => {
      const { fixture } = await render({ scriptFails: true });
      await play(fixture);
      const frame = root(fixture).querySelector('iframe') as HTMLIFrameElement;
      Object.defineProperty(frame, 'src', { value: 'about:blank', configurable: true });

      frame.dispatchEvent(new Event('load'));
      await settle(fixture);

      expect(loading(fixture)).not.toBeNull();
    });

    it('names the fallback frame after the track, in the visitor language', async () => {
      const { fixture } = await render({ scriptFails: true, language: Language.PT });

      await play(fixture, ID, 'Quase Nua');

      expect(root(fixture).querySelector('iframe')?.title).toBe('Player do Spotify para Quase Nua');
    });

    it('uses the dark player when the page is dark', async () => {
      const { fixture } = await render({ scriptFails: true });
      TestBed.inject(Theme).setMode(ThemeMode.DARK);

      await play(fixture);

      expect(root(fixture).querySelector('iframe')?.src).toBe(
        `https://open.spotify.com/embed/track/${ID}?theme=0&locale=en`,
      );
    });

    it('tries Spotify script again after the bar was closed', async () => {
      const { fixture, load } = await render({ scriptFails: true });
      await play(fixture);
      closeButton(fixture)?.click();
      await settle(fixture);

      await play(fixture, OTHER_ID);

      expect(load).toHaveBeenCalledTimes(2);
    });

    it('follows the track chosen next', async () => {
      const { fixture } = await render({ scriptFails: true });
      await play(fixture, ID);

      await play(fixture, OTHER_ID);

      expect(root(fixture).querySelectorAll('iframe')).toHaveLength(1);
      expect(root(fixture).querySelector('iframe')?.src).toBe(
        `https://open.spotify.com/embed/track/${OTHER_ID}?locale=en`,
      );
    });
  });

  describe('closing', () => {
    it('has a labeled close button, in the visitor language', async () => {
      const english = await render();
      await play(english.fixture);
      expect(closeButton(english.fixture)?.getAttribute('aria-label')).toBe('Close the player');
      TestBed.resetTestingModule();

      const portuguese = await render({ language: Language.PT });
      await play(portuguese.fixture);
      expect(closeButton(portuguese.fixture)?.getAttribute('aria-label')).toBe('Fechar o player');
    });

    it('stops the music, takes the embed down and removes the bar', async () => {
      const { fixture, controllers } = await render();
      await play(fixture);

      closeButton(fixture)?.click();
      await settle(fixture);

      expect(TestBed.inject(NowPlaying).track()).toBeNull();
      expect(controllers[0].destroyed).toBe(true);
      expect(root(fixture).querySelector('section')).toBeNull();
    });

    it('makes a new embed when a track is chosen again afterwards', async () => {
      const { fixture, controllers } = await render();
      await play(fixture, ID);
      closeButton(fixture)?.click();
      await settle(fixture);

      await play(fixture, OTHER_ID);

      expect(controllers).toHaveLength(2);
      expect(controllers[1].destroyed).toBe(false);
    });

    it('drops an embed that arrives after the bar was closed', async () => {
      const { fixture, controllers, load } = await render();
      let release!: () => void;
      load.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            release = () =>
              resolve({
                createController: (
                  _element: HTMLElement,
                  _options: SpotifyEmbedOptions,
                  callback: (controller: SpotifyEmbedController) => void,
                ) => {
                  const controller = new FakeController();
                  controllers.push(controller);
                  callback(controller);
                },
              });
          }),
      );
      await play(fixture);

      closeButton(fixture)?.click();
      await settle(fixture);
      release();
      await settle(fixture);

      expect(controllers).toHaveLength(0);
    });

    it('destroys an embed that answers after the bar was closed', async () => {
      const { fixture, held } = await render({ holdControllers: true });
      await play(fixture);
      const late = new FakeController();

      closeButton(fixture)?.click();
      await settle(fixture);
      held[0](late);

      expect(late.destroyed).toBe(true);
    });

    it('does not count a script failure that comes after the bar was closed', async () => {
      const { fixture, load } = await render();
      let fail!: () => void;
      load.mockImplementationOnce(
        () => new Promise((_resolve, reject) => (fail = () => reject(new Error('late')))),
      );
      await play(fixture);

      closeButton(fixture)?.click();
      await settle(fixture);
      fail();
      await settle(fixture);
      await play(fixture, OTHER_ID);

      expect(load).toHaveBeenCalledTimes(2);
      expect(root(fixture).querySelector('.bar__mount')).not.toBeNull();
      expect(root(fixture).querySelector('iframe')).toBeNull();
    });
  });

  describe('when a step of the start stalls', () => {
    // Fake timers only once the page is rendered (Angular's own waiting needs real ones), and the checks that
    // follow flush effects and promises by hand.
    afterEach(() => vi.useRealTimers());

    const start = async (options: Parameters<typeof render>[0] = {}) => {
      const setup = await render(options);
      vi.useFakeTimers();
      return setup;
    };
    const flush = async (fixture: ComponentFixture<PlayerBar>, ms = 0) => {
      for (let round = 0; round < 3; round++) {
        fixture.detectChanges();
        await vi.advanceTimersByTimeAsync(round === 0 ? ms : 0);
      }
      fixture.detectChanges();
    };
    const begin = async (fixture: ComponentFixture<PlayerBar>, id = ID) => {
      TestBed.inject(NowPlaying).play(track({ id }));
      await flush(fixture);
    };

    it('falls back to the plain embed when the embed never answers', async () => {
      const { fixture } = await start({ holdControllers: true });
      await begin(fixture);

      await flush(fixture, SPOTIFY_EMBED_READY_TIMEOUT_MS);

      expect(root(fixture).querySelector('iframe')?.src).toBe(
        `https://open.spotify.com/embed/track/${ID}?locale=en`,
      );
    });

    it('falls back, taking the embed down, when it never says it is ready', async () => {
      const { fixture, controllers } = await start();
      await begin(fixture);

      await flush(fixture, SPOTIFY_EMBED_READY_TIMEOUT_MS);

      expect(controllers[0].destroyed).toBe(true);
      expect(root(fixture).querySelector('iframe')).not.toBeNull();
    });

    it('destroys an embed that answers after the deadline', async () => {
      const { fixture, held } = await start({ holdControllers: true });
      await begin(fixture);
      await flush(fixture, SPOTIFY_EMBED_READY_TIMEOUT_MS);
      const late = new FakeController();

      held[0](late);

      expect(late.destroyed).toBe(true);
    });

    it('does not fall back once the embed is ready', async () => {
      const { fixture, controllers } = await start();
      await begin(fixture);
      controllers[0].emit(SpotifyEmbedEvent.READY);

      await flush(fixture, SPOTIFY_EMBED_READY_TIMEOUT_MS * 2);

      expect(controllers[0].destroyed).toBe(false);
      expect(root(fixture).querySelector('.bar__mount')).not.toBeNull();
    });

    it('does not fall back after the bar was closed', async () => {
      const { fixture, load } = await start({ holdControllers: true });
      await begin(fixture);
      closeButton(fixture)?.click();
      await flush(fixture);

      await flush(fixture, SPOTIFY_EMBED_READY_TIMEOUT_MS * 2);
      await begin(fixture, OTHER_ID);

      expect(load).toHaveBeenCalledTimes(2);
      expect(root(fixture).querySelector('.bar__mount')).not.toBeNull();
    });
  });

  describe('in the language of the page, not the one of the browser', () => {
    afterEach(() => Reflect.deleteProperty(window, 'SpotifyIframeConfig'));

    it.each([
      [Language.PT, 'pt-BR'],
      [Language.ES, 'es'],
      [Language.RU, 'ru'],
      [Language.FR, 'fr'],
      [Language.TR, 'tr'],
      [Language.EN, 'en'],
    ])(
      'asks the Spotify script for the embed in that language before making it (%s)',
      async (language, locale) => {
        const config: { locale?: string } = {};
        Object.defineProperty(window, 'SpotifyIframeConfig', { configurable: true, value: config });
        const { fixture } = await render({ language });
        const seen: (string | undefined)[] = [];
        TestBed.inject(SpotifyIframeApi).load = async () => ({
          createController: () => seen.push(config.locale),
        });

        await play(fixture);

        expect(seen).toEqual([locale]);
      },
    );

    it('puts the plain embed in that language too, with the dark theme when the page is dark', async () => {
      const { fixture } = await render({ language: Language.PT, scriptFails: true });
      TestBed.inject(Theme).setMode(ThemeMode.DARK);

      await play(fixture);

      expect(root(fixture).querySelector('iframe')?.src).toBe(
        `https://open.spotify.com/embed/track/${ID}?theme=0&locale=pt-BR`,
      );
    });

    it('follows the language when it changes while the plain embed is on screen', async () => {
      const { fixture } = await render({ language: Language.EN, scriptFails: true });
      await play(fixture);

      await useLanguage(Language.FR);
      await settle(fixture);

      expect(root(fixture).querySelector('iframe')?.src).toContain('locale=fr');
    });
  });

  it('takes the embed down with the page', async () => {
    const { fixture, controllers } = await render();
    await play(fixture);

    fixture.destroy();

    expect(controllers[0].destroyed).toBe(true);
  });
});
