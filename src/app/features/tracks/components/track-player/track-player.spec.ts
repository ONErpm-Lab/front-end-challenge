import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Track } from '../../../../../contract/tracks.interfaces';
import { Language } from '../../../../core/i18n/i18n.enums';
import { i18nTestProviders, useLanguage } from '../../../../testing/i18n-testing';
import { NowPlaying } from '../../store/now-playing';
import { track } from '../../testing/builders';
import { TrackPlayer } from './track-player';

const ID = '7q7QtMiK9jhob0Md7p715D';
const OTHER_ID = '1A2b3C4d5E6f7G8h9I0j1K';

async function render(
  options: { track?: Partial<Track>; language?: Language } = {},
): Promise<ComponentFixture<TrackPlayer>> {
  TestBed.configureTestingModule({ imports: [TrackPlayer], providers: i18nTestProviders });
  await useLanguage(options.language);
  const fixture = TestBed.createComponent(TrackPlayer);
  fixture.componentRef.setInput('track', track({ id: ID, title: 'Louca', ...options.track }));
  await fixture.whenStable();
  return fixture;
}

const root = (fixture: ComponentFixture<TrackPlayer>) => fixture.nativeElement as HTMLElement;
const button = (fixture: ComponentFixture<TrackPlayer>) =>
  root(fixture).querySelector('button') as HTMLButtonElement | null;
const settle = async (fixture: ComponentFixture<TrackPlayer>) => {
  await fixture.whenStable();
  fixture.detectChanges();
};

describe('TrackPlayer (the listen control of a card)', () => {
  beforeEach(() => localStorage.clear());

  it('shows only a button, never an embed: nothing from Spotify loads from a card', async () => {
    const fixture = await render();

    expect(button(fixture)).not.toBeNull();
    expect(root(fixture).querySelector('iframe')).toBeNull();
  });

  it('does not ask the browser to focus the button on load', async () => {
    const fixture = await render();

    expect(root(fixture).querySelector('[autofocus]')).toBeNull();
  });

  it('labels the button, in the visitor language', async () => {
    const english = await render({ language: Language.EN });
    expect(button(english)?.textContent?.trim()).toBe('Listen to a preview');
    TestBed.resetTestingModule();

    const russian = await render({ language: Language.RU });
    expect(button(russian)?.textContent?.trim()).toBe('Послушать фрагмент');
  });

  it('is a group named "Audio preview" for assistive technology', async () => {
    const fixture = await render();

    const group = root(fixture).querySelector('[role="group"]');

    expect(group?.getAttribute('aria-label')).toBe('Audio preview');
  });

  describe('when the visitor asks to listen', () => {
    it('hands this track to the player bar, with the button so the focus can come back', async () => {
      const fixture = await render({ track: { title: 'Quase Nua' } });
      const nowPlaying = TestBed.inject(NowPlaying);
      const play = vi.spyOn(nowPlaying, 'play');

      button(fixture)?.click();

      expect(play).toHaveBeenCalledTimes(1);
      expect(play.mock.calls[0][0].id).toBe(ID);
      expect(play.mock.calls[0][0].title).toBe('Quase Nua');
      expect(play.mock.calls[0][1]).toBe(button(fixture));
    });

    it('marks itself as the track playing, with its own label and no longer "listen"', async () => {
      const fixture = await render();

      button(fixture)?.click();
      await settle(fixture);

      expect(button(fixture)?.getAttribute('aria-current')).toBe('true');
      expect(button(fixture)?.textContent?.trim()).toBe('Now playing');
    });

    it('says it in the visitor language', async () => {
      const fixture = await render({ language: Language.PT });

      button(fixture)?.click();
      await settle(fixture);

      expect(button(fixture)?.textContent?.trim()).toBe('Tocando agora');
    });
  });

  describe('when another track is the one playing', () => {
    it('is not marked, and still offers to listen', async () => {
      const fixture = await render();
      TestBed.inject(NowPlaying).play(track({ id: OTHER_ID }));
      await settle(fixture);

      expect(button(fixture)?.getAttribute('aria-current')).toBeNull();
      expect(button(fixture)?.textContent?.trim()).toBe('Listen to a preview');
    });

    it('goes back to "listen" when its track is replaced', async () => {
      const fixture = await render();
      button(fixture)?.click();
      await settle(fixture);

      TestBed.inject(NowPlaying).play(track({ id: OTHER_ID }));
      await settle(fixture);

      expect(button(fixture)?.textContent?.trim()).toBe('Listen to a preview');
    });

    it('goes back to "listen" when the player is closed', async () => {
      const fixture = await render();
      button(fixture)?.click();
      await settle(fixture);

      TestBed.inject(NowPlaying).stop();
      await settle(fixture);

      expect(button(fixture)?.getAttribute('aria-current')).toBeNull();
    });
  });

  describe('with an id that is not a Spotify id', () => {
    it.each([
      ['empty', ''],
      ['a URL instead of an id', 'https://evil.example/x'],
      ['markup', '"><img src=x onerror=alert(1)>'],
    ])('offers nothing to play (%s)', async (_label, id) => {
      const fixture = await render({ track: { id } });

      expect(button(fixture)).toBeNull();
      expect(root(fixture).querySelector('.player')).toBeNull();
    });
  });
});
