import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Language } from '../../../../core/i18n/i18n.enums';
import { ThemeService } from '../../../../core/theme/theme.service';
import { ThemeMode } from '../../../../core/theme/theme.enums';
import { i18nTestProviders, useLanguage } from '../../../../../testing/i18n-testing';
import { SpotifyEmbedEvent } from '../../../../api/spotify-player/spotify-player.enums';
import { track } from '../../testing/builders';
import { FakeSpotify, fakeSpotify } from '../../testing/fake-spotify';
import { SpotifyPreviewComponent } from './spotify-preview.component';

const ID = '7q7QtMiK9jhob0Md7p715D';
const OTHER_ID = '1A2b3C4d5E6f7G8h9I0j1K';

async function render(
  options: { scriptFails?: boolean; language?: Language; dark?: boolean } = {},
): Promise<{ fixture: ComponentFixture<SpotifyPreviewComponent>; spotify: FakeSpotify }> {
  const spotify = fakeSpotify({ scriptFails: options.scriptFails });
  TestBed.configureTestingModule({ providers: [...i18nTestProviders, spotify.provider] });
  await useLanguage(options.language);
  if (options.dark) {
    TestBed.inject(ThemeService).set(ThemeMode.DARK);
  }
  const fixture = TestBed.createComponent(SpotifyPreviewComponent);
  fixture.componentRef.setInput('track', track({ id: ID, title: 'Louca' }));
  await settle(fixture);
  return { fixture, spotify };
}

async function settle(fixture: ComponentFixture<SpotifyPreviewComponent>): Promise<void> {
  for (let round = 0; round < 3; round++) {
    await fixture.whenStable();
    fixture.detectChanges();
  }
}

const root = (fixture: ComponentFixture<SpotifyPreviewComponent>) =>
  fixture.nativeElement as HTMLElement;
const loading = (fixture: ComponentFixture<SpotifyPreviewComponent>) =>
  root(fixture).querySelector('.loading');
const frame = (fixture: ComponentFixture<SpotifyPreviewComponent>) =>
  root(fixture).querySelector('iframe.frame') as HTMLIFrameElement | null;

describe('SpotifyPreview', () => {
  afterEach(() => document.documentElement.removeAttribute('data-theme'));

  it('makes the embedded player for the track, in the slim size, inside its own mount point', async () => {
    const { fixture, spotify } = await render();

    expect(spotify.load).toHaveBeenCalledTimes(1);
    expect(spotify.created[0].options).toMatchObject({ uri: `spotify:track:${ID}`, height: 80 });
    expect(root(fixture).querySelector('.mount')?.contains(spotify.created[0].element)).toBe(true);
  });

  it('says it is loading, with the embed hidden, until Spotify says it is ready', async () => {
    const { fixture, spotify } = await render();

    expect(loading(fixture)?.textContent).toContain('Loading the player');
    expect(root(fixture).querySelector('.mount')?.classList).toContain('pending');

    spotify.controllers[0].emit(SpotifyEmbedEvent.READY);
    await settle(fixture);

    expect(loading(fixture)).toBeNull();
    expect(spotify.controllers[0].calls).toContain('play');
  });

  it('swaps the track in the same player when it changes', async () => {
    const { fixture, spotify } = await render();
    spotify.controllers[0].emit(SpotifyEmbedEvent.READY);

    fixture.componentRef.setInput('track', track({ id: OTHER_ID, title: 'Repente' }));
    await settle(fixture);

    expect(spotify.created).toHaveLength(1);
    expect(spotify.controllers[0].calls).toContain(`loadUri spotify:track:${OTHER_ID}`);
  });

  it('takes the embed down with the component', async () => {
    const { fixture, spotify } = await render();

    fixture.destroy();

    expect(spotify.controllers[0].destroyed).toBe(true);
  });

  describe('when Spotify script cannot be loaded', () => {
    it('falls back to the plain embed, named after the track, kept hidden until it loads', async () => {
      const { fixture } = await render({ scriptFails: true });

      const iframe = frame(fixture) as HTMLIFrameElement;
      expect(iframe.src).toBe(`https://open.spotify.com/embed/track/${ID}?locale=en`);
      expect(iframe.title).toBe('Spotify player for Louca');
      expect(iframe.classList).toContain('pending');

      iframe.dispatchEvent(new Event('load'));
      await settle(fixture);

      expect(frame(fixture)?.classList).not.toContain('pending');
      expect(loading(fixture)).toBeNull();
    });

    it('ignores a load of something that is not the Spotify embed', async () => {
      const { fixture } = await render({ scriptFails: true });
      const iframe = frame(fixture) as HTMLIFrameElement;
      Object.defineProperty(iframe, 'src', { value: 'about:blank' });

      iframe.dispatchEvent(new Event('load'));
      await settle(fixture);

      expect(loading(fixture)).not.toBeNull();
    });

    it('uses the dark player and the language of the page', async () => {
      const { fixture } = await render({ scriptFails: true, dark: true, language: Language.PT });

      expect(frame(fixture)?.src).toBe(
        `https://open.spotify.com/embed/track/${ID}?theme=0&locale=pt-BR`,
      );
    });
  });
});
