import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { TrackLookupResult } from '../../../../../contract/tracks.types';
import { Language } from '../../../../core/i18n/i18n.enums';
import { i18nTestProviders, useLanguage } from '../../../../testing/i18n-testing';
import { errorResult, foundResult, notFoundResult } from '../../testing/builders';
import { TracksApi } from '../../api/tracks-api';
import { TracksUnavailableError } from '../../api/tracks-unavailable-error';
import { TracksPage } from './tracks-page';

/**
 * Lets effects run, requests settle and the view catch up. It does not use `whenStable()`: a request still waiting
 * for its Subject is a pending task, so the fixture would never be stable while the test waits for the answer.
 */
async function flush(fixture: ComponentFixture<unknown>): Promise<void> {
  for (let round = 0; round < 3; round++) {
    fixture.detectChanges();
    await new Promise<void>((resolve) => setTimeout(resolve));
  }
}

/** One Subject per request, so each test decides when and how the BFF answers. */
async function render(options: { language?: Language } = {}) {
  const requests: Subject<readonly TrackLookupResult[]>[] = [];
  const lookup = vi.fn(() => {
    const response = new Subject<readonly TrackLookupResult[]>();
    requests.push(response);
    return response;
  });
  TestBed.configureTestingModule({
    imports: [TracksPage],
    providers: [...i18nTestProviders, { provide: TracksApi, useValue: { lookup } }],
  });
  await useLanguage(options.language);
  const fixture = TestBed.createComponent(TracksPage);
  await flush(fixture);
  return { fixture, lookup, requests };
}

const root = (fixture: ComponentFixture<TracksPage>) => fixture.nativeElement as HTMLElement;
const settle = (fixture: ComponentFixture<TracksPage>) => flush(fixture);
const text = (element: Element | null | undefined) =>
  element?.textContent?.replace(/\s+/g, ' ').trim();
/** What each list entry shows as its headline: a track's title, or an ISRC with the reason it has no track. */
const items = (fixture: ComponentFixture<TracksPage>) =>
  [...root(fixture).querySelectorAll('li')].map((item) =>
    item.querySelector('orp-track-card')
      ? text(item.querySelector('h2'))
      : `${text(item.querySelector('.card__isrc'))} ${text(item.querySelector('.card__message'))}`,
  );

describe('TracksPage', () => {
  beforeEach(() => localStorage.clear());

  describe('hero', () => {
    it('has one heading, the page title, naming the main region', async () => {
      const { fixture } = await render();

      const headings = root(fixture).querySelectorAll('h1');

      expect(headings).toHaveLength(1);
      expect(headings[0].textContent).toBe('Missing ISRCs');
      expect(root(fixture).querySelector('section.hero')?.getAttribute('aria-labelledby')).toBe(
        headings[0].id,
      );
    });

    it.each([
      [Language.EN, 'Missing ISRCs'],
      [Language.PT, 'ISRCs ausentes'],
      [Language.ES, 'ISRC ausentes'],
      [Language.RU, 'Отсутствующие ISRC'],
      [Language.FR, 'ISRC manquants'],
      [Language.TR, "Eksik ISRC'ler"],
    ])('is translated (%s)', async (language, title) => {
      const { fixture } = await render({ language });

      expect(root(fixture).querySelector('h1')?.textContent).toBe(title);
      expect(root(fixture).querySelector('.hero__subtitle')?.textContent?.trim()).not.toBe('');
    });
  });

  describe('loading', () => {
    it('asks for the tracks once, as soon as the page is shown', async () => {
      const { lookup } = await render();

      expect(lookup).toHaveBeenCalledTimes(1);
    });

    it('shows placeholders and a status message, and marks the region busy, until the answer comes', async () => {
      const { fixture } = await render();

      expect(root(fixture).querySelectorAll('p-skeleton')).toHaveLength(4);
      expect(root(fixture).querySelector('[role="status"]')?.textContent).toBe('Loading tracks…');
      expect(root(fixture).querySelector('section.content')?.getAttribute('aria-busy')).toBe(
        'true',
      );
      expect(root(fixture).querySelector('ol')).toBeNull();
    });

    it('hides the placeholders from assistive technology (the status message speaks for them)', async () => {
      const { fixture } = await render();

      expect(root(fixture).querySelector('.grid')?.getAttribute('aria-hidden')).toBe('true');
    });

    it('translates the loading message', async () => {
      const { fixture } = await render({ language: Language.PT });

      expect(root(fixture).querySelector('[role="status"]')?.textContent).toBe(
        'Carregando faixas…',
      );
    });
  });

  describe('when the tracks arrive', () => {
    it('lists them by title, A to Z, one card each', async () => {
      const { fixture, requests } = await render();

      requests[0].next([foundResult('Repente'), foundResult('Louca'), foundResult('Quase Nua')]);
      await settle(fixture);

      expect(items(fixture)).toEqual(['Louca', 'Quase Nua', 'Repente']);
      expect(root(fixture).querySelectorAll('orp-track-card')).toHaveLength(3);
    });

    it('gives each track card its own track', async () => {
      const { fixture, requests } = await render();

      requests[0].next([foundResult('Louca', { artists: ['DJ Malibu'], durationMs: 124_315 })]);
      await settle(fixture);

      const card = root(fixture).querySelector('orp-track-card');
      expect(text(card?.querySelector('.card__artists'))).toBe('DJ Malibu');
      expect(text(card)).toContain('02:04');
    });

    it('shows ISRCs without a track as their own cards, among the tracks, never as track cards', async () => {
      const { fixture, requests } = await render();

      requests[0].next([
        notFoundResult('BR1SP1200070'),
        foundResult('Louca'),
        errorResult('BR1SP1200071'),
      ]);
      await settle(fixture);

      expect(root(fixture).querySelectorAll('orp-track-card')).toHaveLength(1);
      expect(root(fixture).querySelectorAll('orp-isrc-card')).toHaveLength(2);
    });

    it('is a list of cards, readable as such by assistive technology', async () => {
      const { fixture, requests } = await render();

      requests[0].next([foundResult('Louca'), foundResult('Repente')]);
      await settle(fixture);

      const list = root(fixture).querySelector('ul.grid');
      expect(list?.querySelectorAll(':scope > li')).toHaveLength(2);
      expect(list?.closest('section')?.getAttribute('aria-label')).toBe('Tracks');
    });

    it('replaces the placeholders and stops being busy', async () => {
      const { fixture, requests } = await render();

      requests[0].next([foundResult('Louca')]);
      await settle(fixture);

      expect(root(fixture).querySelectorAll('p-skeleton')).toHaveLength(0);
      expect(root(fixture).querySelector('section.content')?.getAttribute('aria-busy')).toBe(
        'false',
      );
    });

    it('keeps an ISRC Spotify does not know in the list, saying so', async () => {
      const { fixture, requests } = await render();

      requests[0].next([foundResult('Louca'), notFoundResult('BR1SP1200070')]);
      await settle(fixture);

      expect(items(fixture)).toEqual(['Louca', 'BR1SP1200070 ISRC not found on Spotify']);
    });

    it('does not warn when everything loaded', async () => {
      const { fixture, requests } = await render();

      requests[0].next([foundResult('Louca')]);
      await settle(fixture);

      expect(root(fixture).querySelector('p-message')).toBeNull();
    });

    it('lists ISRCs that failed, and warns once with how many', async () => {
      const { fixture, requests } = await render();

      requests[0].next([
        foundResult('Louca'),
        errorResult('BR1SP1200070'),
        errorResult('BR1SP1200071'),
      ]);
      await settle(fixture);

      const warning = root(fixture).querySelectorAll('p-message');
      expect(warning).toHaveLength(1);
      expect(text(warning[0])).toBe(
        'Some ISRCs could not be loaded. ISRCs affected: 2 Show affected ISRCs',
      );
      expect(items(fixture).slice(1)).toEqual([
        'BR1SP1200070 Could not load this ISRC',
        'BR1SP1200071 Could not load this ISRC',
      ]);
    });

    describe('the list of affected ISRCs', () => {
      const failures = async (language?: Language) => {
        const page = await render({ language });
        page.requests[0].next([
          foundResult('Louca'),
          errorResult('BR1SP1200070'),
          notFoundResult('XX1AA0000001'),
          errorResult('BR1SP1200071'),
        ]);
        await settle(page.fixture);
        return page;
      };
      const trigger = (fixture: ComponentFixture<TracksPage>) =>
        root(fixture).querySelector('button.alert__link') as HTMLButtonElement;
      const dialog = () => document.body.querySelector('[role="dialog"]') as HTMLElement | null;
      const open = async (fixture: ComponentFixture<TracksPage>) => {
        trigger(fixture).click();
        await settle(fixture);
      };

      afterEach(() => document.body.querySelectorAll('p-dialog').forEach((d) => d.remove()));

      it('is behind a button in the warning, closed at first', async () => {
        const { fixture } = await failures();

        expect(text(trigger(fixture))).toBe('Show affected ISRCs');
        expect(trigger(fixture).getAttribute('aria-haspopup')).toBe('dialog');
        expect(dialog()).toBeNull();
      });

      it('opens a modal dialog listing only the ISRCs that failed', async () => {
        const { fixture } = await failures();

        await open(fixture);

        expect(text(dialog()?.querySelector('.p-dialog-title, [id$="_header"]'))).toBe(
          'ISRCs that could not be loaded',
        );
        expect(
          [...(dialog()?.querySelectorAll('.affected__isrc') ?? [])].map((item) => text(item)),
        ).toEqual(['BR1SP1200070', 'BR1SP1200071']);
      });

      it('names the list and makes it reachable by keyboard, since a long one scrolls', async () => {
        const { fixture } = await failures();

        await open(fixture);

        const list = dialog()?.querySelector('ul.affected__list') as HTMLElement;
        expect(list.getAttribute('aria-label')).toBe('Affected ISRCs');
        expect(list.getAttribute('tabindex')).toBe('0');
      });

      it('is translated, including the close button label', async () => {
        const { fixture } = await failures(Language.PT);

        await open(fixture);

        expect(text(trigger(fixture))).toBe('Ver ISRCs afetados');
        expect(text(dialog())).toContain('ISRCs que não puderam ser carregados');
        expect(dialog()?.querySelector('[aria-label="Fechar"]')).not.toBeNull();
      });

      it('asks Spotify again for everything, and closes, when the visitor tries again', async () => {
        const { fixture, lookup, requests } = await failures();
        await open(fixture);

        [...(dialog()?.querySelectorAll('button') ?? [])]
          .find((button) => text(button) === 'Try again')
          ?.click();
        await settle(fixture);

        expect(lookup).toHaveBeenCalledTimes(2);
        expect(dialog()).toBeNull();
        requests[1].next([foundResult('Louca')]);
        await settle(fixture);
        expect(root(fixture).querySelector('button.alert__link')).toBeNull();
      });

      it('is not offered when nothing failed', async () => {
        const { fixture, requests } = await render();

        requests[0].next([foundResult('Louca'), notFoundResult('XX1AA0000001')]);
        await settle(fixture);

        expect(trigger(fixture)).toBeNull();
      });
    });

    describe('toolbar: filter, summary and ISRCs not in the database', () => {
      const LIST = [
        foundResult('Louca', { isrc: 'BXKZM1900345' }),
        foundResult('...É pra Você', { isrc: 'BR1SP1200071' }),
        foundResult('IRON MAIDEN', { isrc: 'NO1R42509310' }),
        notFoundResult('XX1AA0000002'),
        notFoundResult('XX1AA0000001'),
      ];
      const loaded = async (language?: Language, results = LIST) => {
        const page = await render({ language });
        page.requests[0].next(results);
        await settle(page.fixture);
        return page;
      };
      const input = (fixture: ComponentFixture<TracksPage>) =>
        root(fixture).querySelector('input.toolbar__input') as HTMLInputElement;
      const type = async (fixture: ComponentFixture<TracksPage>, value: string) => {
        input(fixture).value = value;
        input(fixture).dispatchEvent(new Event('input'));
        await settle(fixture);
      };
      const summary = (fixture: ComponentFixture<TracksPage>) =>
        text(root(fixture).querySelector('.toolbar__summary'));
      const missingTrigger = (fixture: ComponentFixture<TracksPage>) =>
        root(fixture).querySelector('button.toolbar__missing') as HTMLButtonElement | null;
      const dialog = () => document.body.querySelector('[role="dialog"]') as HTMLElement | null;

      afterEach(() => document.body.querySelectorAll('p-dialog').forEach((d) => d.remove()));

      it('has a labelled filter field inside a search landmark', async () => {
        const { fixture } = await loaded();

        expect(root(fixture).querySelector('[role="search"]')).not.toBeNull();
        expect(input(fixture).getAttribute('aria-label')).toBe('Filter by track name or ISRC');
        expect(input(fixture).placeholder).toBe('Track name or ISRC');
        expect(input(fixture).value).toBe('');
      });

      it('says how many ISRCs were found out of the total', async () => {
        const { fixture } = await loaded();

        expect(summary(fixture)).toBe('Tracks on Spotify: 3');
      });

      it('counts only the tracks Spotify has, not the ISRCs without one', async () => {
        const { fixture } = await loaded(undefined, [
          foundResult('Louca'),
          foundResult('Quase Nua'),
          notFoundResult('XX1AA0000001'),
          errorResult('XX1AA0000002'),
        ]);

        expect(summary(fixture)).toBe('Tracks on Spotify: 2');
      });

      describe('the order of the tracks', () => {
        const sortButton = (fixture: ComponentFixture<TracksPage>) =>
          root(fixture).querySelector('button.toolbar__sort') as HTMLButtonElement;
        const announcement = (fixture: ComponentFixture<TracksPage>) =>
          text(sortButton(fixture).parentElement?.querySelector('span.visually-hidden'));

        it('is A to Z at first, said by the button and by a note for screen readers', async () => {
          const { fixture } = await loaded();

          expect(text(sortButton(fixture))).toBe('Title A–Z');
          expect(sortButton(fixture).title).toBe('Reverse the order');
          expect(sortButton(fixture).getAttribute('aria-label')).toBe(
            'Reverse the order: Title A–Z',
          );
          expect(announcement(fixture)).toBe('Sorted by title, A to Z');
          expect(sortButton(fixture).querySelector('i')?.className).toContain('pi-sort-alpha-down');
          expect(sortButton(fixture).querySelector('i')?.getAttribute('aria-hidden')).toBe('true');
          expect(items(fixture).slice(0, 3)).toEqual(['...É pra Você', 'IRON MAIDEN', 'Louca']);
        });

        it('is reversed by the button, and back by pressing it again', async () => {
          const { fixture } = await loaded();

          sortButton(fixture).click();
          await settle(fixture);
          expect(text(sortButton(fixture))).toBe('Title Z–A');
          expect(announcement(fixture)).toBe('Sorted by title, Z to A');
          expect(sortButton(fixture).querySelector('i')?.className).toContain('alt');
          expect(items(fixture).slice(0, 3)).toEqual(['Louca', 'IRON MAIDEN', '...É pra Você']);

          sortButton(fixture).click();
          await settle(fixture);
          expect(text(sortButton(fixture))).toBe('Title A–Z');
          expect(items(fixture).slice(0, 3)).toEqual(['...É pra Você', 'IRON MAIDEN', 'Louca']);
        });

        it('keeps the ISRCs that have no track after the tracks, and works with the filter', async () => {
          const { fixture } = await loaded();
          sortButton(fixture).click();
          await settle(fixture);

          expect(items(fixture).slice(3)).toEqual([
            'XX1AA0000001 ISRC not found on Spotify',
            'XX1AA0000002 ISRC not found on Spotify',
          ]);

          await type(fixture, 'o');
          expect(items(fixture)[0]).toBe('Louca');
        });

        it('is in the visitor language', async () => {
          const { fixture } = await loaded(Language.PT);

          expect(text(sortButton(fixture))).toBe('Título A–Z');
          expect(sortButton(fixture).title).toBe('Inverter a ordem');
        });
      });

      it('has no toolbar before the answer arrives, or when the provider is down', async () => {
        const { fixture, requests } = await render();
        expect(root(fixture).querySelector('.toolbar')).toBeNull();

        requests[0].error(new TracksUnavailableError());
        await settle(fixture);

        expect(root(fixture).querySelector('.toolbar')).toBeNull();
      });

      it('shows only the tracks whose title matches, and says how many of the list', async () => {
        const { fixture } = await loaded();

        await type(fixture, 'louc');

        expect(items(fixture)).toEqual(['Louca']);
        expect(summary(fixture)).toBe('Showing 1 of 5');
      });

      it('matches an ISRC, with or without separators, and the ISRCs that have no track', async () => {
        const { fixture } = await loaded();

        await type(fixture, 'br1sp-1200071');
        expect(items(fixture)).toEqual(['...É pra Você']);

        await type(fixture, 'XX1AA');
        expect(items(fixture)).toEqual([
          'XX1AA0000001 ISRC not found on Spotify',
          'XX1AA0000002 ISRC not found on Spotify',
        ]);
      });

      it('says when nothing matches, and the empty text follows the query', async () => {
        const { fixture } = await loaded();

        await type(fixture, 'zzzz');

        expect(items(fixture)).toEqual([]);
        expect(text(root(fixture).querySelector('.empty__text'))).toBe('Nothing matches “zzzz”.');
      });

      it('has no empty message while something matches', async () => {
        const { fixture } = await loaded();

        await type(fixture, 'louc');

        expect(root(fixture).querySelector('.empty')).toBeNull();
      });

      it('is cleared by its button, which only exists while there is a query', async () => {
        const { fixture } = await loaded();
        expect(root(fixture).querySelector('.toolbar__clear')).toBeNull();
        await type(fixture, 'louc');

        (root(fixture).querySelector('.toolbar__clear') as HTMLButtonElement).click();
        await settle(fixture);

        expect(input(fixture).value).toBe('');
        expect(items(fixture)).toHaveLength(5);
        expect(root(fixture).querySelector('.toolbar__clear')).toBeNull();
      });

      it('gives the focus back to the field after clearing, whichever way it was cleared', async () => {
        const { fixture } = await loaded();
        await type(fixture, 'louc');
        (root(fixture).querySelector('.toolbar__clear') as HTMLButtonElement).click();
        await settle(fixture);
        expect(document.activeElement).toBe(input(fixture));

        await type(fixture, 'zzzz');
        (document.activeElement as HTMLElement).blur();
        (root(fixture).querySelector('.empty button') as HTMLButtonElement).click();
        await settle(fixture);
        expect(document.activeElement).toBe(input(fixture));
      });

      it('is cleared by Escape, and by the button of the empty message', async () => {
        const { fixture } = await loaded();
        await type(fixture, 'louc');

        input(fixture).dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        await settle(fixture);
        expect(items(fixture)).toHaveLength(5);

        await type(fixture, 'zzzz');
        (root(fixture).querySelector('.empty button') as HTMLButtonElement).click();
        await settle(fixture);
        expect(items(fixture)).toHaveLength(5);
      });

      it('counts the ISRCs that are not in the database, in a button', async () => {
        const { fixture } = await loaded();

        expect(text(missingTrigger(fixture))).toBe('ISRCs not in our database: 2');
        expect(missingTrigger(fixture)?.getAttribute('aria-haspopup')).toBe('dialog');
      });

      it('offers no such button when every ISRC has a track', async () => {
        const { fixture } = await loaded(undefined, [foundResult('Louca')]);

        expect(missingTrigger(fixture)).toBeNull();
      });

      it('opens a dialog with those ISRCs, in order, and nothing else', async () => {
        const { fixture } = await loaded();

        missingTrigger(fixture)?.click();
        await settle(fixture);

        expect(text(dialog()?.querySelector('.p-dialog-title, [id$="_header"]'))).toBe(
          'ISRCs not in our database',
        );
        expect(
          [...(dialog()?.querySelectorAll('.affected__isrc') ?? [])].map((item) => text(item)),
        ).toEqual(['XX1AA0000001', 'XX1AA0000002']);
      });

      it('is in the visitor language', async () => {
        const { fixture } = await loaded(Language.PT);

        expect(summary(fixture)).toBe('Faixas no Spotify: 3');
        expect(text(missingTrigger(fixture))).toBe('ISRCs que não constam na nossa base: 2');
        expect(input(fixture).getAttribute('aria-label')).toBe(
          'Filtrar por nome da música ou ISRC',
        );
      });
    });

    it('is not an alert when only some ISRCs failed', async () => {
      const { fixture, requests } = await render();

      requests[0].next([foundResult('Louca'), errorResult('BR1SP1200070')]);
      await settle(fixture);

      expect(root(fixture).querySelector('[role="alert"]')).toBeNull();
    });
  });

  describe('when the music data provider is unavailable', () => {
    async function unavailable(language?: Language) {
      const page = await render({ language });
      page.requests[0].error(new TracksUnavailableError());
      await settle(page.fixture);
      return page;
    }

    it('alerts the visitor, in their language, and shows no tracks', async () => {
      const { fixture } = await unavailable();

      const alert = root(fixture).querySelector('[role="alert"]');
      expect(alert?.textContent).toContain('Music data unavailable');
      expect(root(fixture).querySelector('section.content')?.getAttribute('aria-busy')).toBe(
        'false',
      );
      expect(alert?.textContent).toContain(
        'We could not reach Spotify right now. Please try again in a moment.',
      );
      expect(root(fixture).querySelector('ol')).toBeNull();
      expect(root(fixture).querySelectorAll('p-skeleton')).toHaveLength(0);
    });

    it.each([
      [Language.PT, 'Dados musicais indisponíveis', 'Tentar novamente'],
      [Language.RU, 'Музыкальные данные недоступны', 'Повторить'],
      [Language.TR, 'Müzik verileri kullanılamıyor', 'Tekrar dene'],
    ])('translates the alert and the retry button (%s)', async (language, title, retry) => {
      const { fixture } = await unavailable(language);

      const alert = root(fixture).querySelector('[role="alert"]');
      expect(alert?.textContent).toContain(title);
      expect(alert?.querySelector('button')?.textContent?.trim()).toBe(retry);
    });

    it('does not move focus to the retry button by itself', async () => {
      const { fixture } = await unavailable();

      expect(root(fixture).querySelector('[autofocus]')).toBeNull();
    });

    it('offers a retry that asks again, showing the placeholders meanwhile', async () => {
      const { fixture, lookup } = await unavailable();

      (root(fixture).querySelector('[role="alert"] button') as HTMLButtonElement).click();
      await settle(fixture);

      expect(root(fixture).querySelector('section.content')?.getAttribute('aria-busy')).toBe(
        'true',
      );
      expect(lookup).toHaveBeenCalledTimes(2);
      expect(root(fixture).querySelector('[role="alert"]')).toBeNull();
      expect(root(fixture).querySelectorAll('p-skeleton')).toHaveLength(4);
    });

    it('recovers into the list when the retry succeeds', async () => {
      const { fixture, requests } = await unavailable();

      (root(fixture).querySelector('[role="alert"] button') as HTMLButtonElement).click();
      await settle(fixture);
      requests[1].next([foundResult('Louca')]);
      await settle(fixture);

      expect(root(fixture).querySelector('[role="alert"]')).toBeNull();
      expect(items(fixture)).toHaveLength(1);
    });

    it('shows the alert again if the retry fails too', async () => {
      const { fixture, requests } = await unavailable();

      (root(fixture).querySelector('[role="alert"] button') as HTMLButtonElement).click();
      await settle(fixture);
      requests[1].error(new TracksUnavailableError());
      await settle(fixture);

      expect(root(fixture).querySelector('[role="alert"]')).not.toBeNull();
    });
  });

  it('follows a language change while the list is on screen', async () => {
    const { fixture, requests } = await render();
    requests[0].next([notFoundResult('BR1SP1200070')]);
    await settle(fixture);

    await useLanguage(Language.PT);
    await settle(fixture);

    expect(items(fixture)).toEqual(['BR1SP1200070 ISRC não encontrado no Spotify']);
  });
});
