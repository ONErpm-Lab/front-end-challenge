import { Clipboard } from '@angular/cdk/clipboard';
import { BreakpointObserver } from '@angular/cdk/layout';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { ReleaseDatePrecision } from '../../../../models/tracks.enums';
import { TrackLookupResult } from '../../../../models/tracks.types';
import { Language } from '../../../../core/i18n/i18n.enums';
import { i18nTestProviders, useLanguage } from '../../../../../testing/i18n-testing';
import { TrackLookupService } from '../../../../services/track-lookup/track-lookup.service';
import { TracksUnavailableError } from '../../../../services/track-lookup/tracks-unavailable-error';
import { NowPlayingService } from '../../store/now-playing.service';
import { errorResult, foundResult, notFoundResult } from '../../testing/builders';
import { fakeSpotify } from '../../testing/fake-spotify';
import { CatalogPageComponent } from './catalog-page.component';

const day = (value: string) => ({ value, precision: ReleaseDatePrecision.DAY });
const LOUCA = foundResult('Louca', {
  id: '1Esxp6lXJWU7TaOQM2JsQn',
  isrc: 'BXKZM1900345',
  artists: ['DJ Malibu', 'MC Pack'],
  albumName: 'Louca',
  releaseDate: day('2019-10-04'),
  durationMs: 124_315,
});
const QUASE = foundResult('Quase Nua', {
  id: '7u8QESpplZWyZZDsoHeIAX',
  isrc: 'BR1SP1500002',
  artists: ['Clarisse Grova'],
  albumName: 'Premonições',
  releaseDate: day('2015-08-27'),
  durationMs: 253_320,
});
const REPENTE = foundResult('Repente', {
  id: '4lwE7ainG51zmxt1xAC7XQ',
  isrc: 'BRC310600002',
  availableInBR: false,
  releaseDate: day('2013-06-13'),
  durationMs: 170_733,
});
const MISSING = notFoundResult('QZNJX2081700');
const FAILED = errorResult('BXKZM1900338');

interface Options {
  readonly phone?: boolean;
  readonly language?: Language;
}

async function render(options: Options = {}) {
  const copy = vi.fn(() => true);
  // One Subject per lookup, so each test answers it when and how it wants.
  const requests: Subject<readonly TrackLookupResult[]>[] = [];
  const lookup = vi.fn<TrackLookupService['lookup']>(() => {
    const response = new Subject<readonly TrackLookupResult[]>();
    requests.push(response);
    return response;
  });
  const spotify = fakeSpotify();
  TestBed.configureTestingModule({
    providers: [
      { provide: TrackLookupService, useValue: { lookup } },
      ...i18nTestProviders,
      spotify.provider,
      { provide: Clipboard, useValue: { copy } },
      {
        provide: BreakpointObserver,
        useValue: { observe: () => of({ matches: options.phone ?? false, breakpoints: {} }) },
      },
    ],
  });
  await useLanguage(options.language);
  const fixture = TestBed.createComponent(CatalogPageComponent);
  await settle(fixture);
  return { fixture, requests, lookup, copy, spotify };
}

/**
 * Lets effects, the request and rendering settle. Never `whenStable()` here: the page waits for a request
 * that the test answers by hand, so the fixture is not stable until then.
 */
async function settle(fixture: ComponentFixture<CatalogPageComponent>): Promise<void> {
  for (let round = 0; round < 3; round++) {
    TestBed.tick();
    await new Promise<void>((resolve) => setTimeout(resolve));
    fixture.detectChanges();
  }
}

async function loaded(results: readonly TrackLookupResult[], options: Options = {}) {
  const page = await render(options);
  answer(page.requests[0], results);
  await settle(page.fixture);
  return page;
}

function answer(
  request: Subject<readonly TrackLookupResult[]>,
  results: readonly TrackLookupResult[],
): void {
  request.next(results);
  request.complete();
}

const root = (fixture: ComponentFixture<CatalogPageComponent>) =>
  fixture.nativeElement as HTMLElement;
const text = (element: Element | null | undefined) =>
  element?.textContent?.replace(/\s+/g, ' ').trim();
const rowTitles = (fixture: ComponentFixture<CatalogPageComponent>) =>
  [...root(fixture).querySelectorAll('tbody tr')].map((row) =>
    text(row.querySelector('.track__title, .track__isrc')),
  );
const button = (fixture: ComponentFixture<CatalogPageComponent>, label: string) =>
  [...root(fixture).querySelectorAll('button')].find((candidate) =>
    text(candidate)?.includes(label),
  ) as HTMLButtonElement;
const detail = (fixture: ComponentFixture<CatalogPageComponent>) =>
  root(fixture).querySelector('aside');
const overlay = () => document.querySelector('.cdk-overlay-container') as HTMLElement;

async function type(fixture: ComponentFixture<CatalogPageComponent>, value: string): Promise<void> {
  const input = root(fixture).querySelector('input[type="search"]') as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input'));
  await settle(fixture);
}

describe('CatalogPage', () => {
  afterEach(() => {
    overlay()?.replaceChildren();
  });

  describe('while the tracks load', () => {
    it('shows the title, and placeholders marked busy instead of numbers and rows', async () => {
      const { fixture } = await render();

      expect(text(root(fixture).querySelector('h1'))).toBe('Missing ISRCs');
      expect(
        root(fixture).querySelector('orp-catalog-summary section')?.getAttribute('aria-busy'),
      ).toBe('true');
      expect(root(fixture).querySelectorAll('tbody tr[aria-hidden="true"]').length).toBeGreaterThan(
        0,
      );
      expect(text(root(fixture).querySelector('.count'))).toBe('');
    });

    it('looks up the ten ISRCs of the challenge', async () => {
      const { lookup } = await render();

      expect(lookup).toHaveBeenCalledTimes(1);
      expect(lookup.mock.calls[0][0]).toHaveLength(10);
    });
  });

  describe('once loaded', () => {
    it('lists the tracks by title, then the ISRCs without a track', async () => {
      const { fixture } = await loaded([REPENTE, MISSING, QUASE, FAILED, LOUCA]);

      expect(rowTitles(fixture)).toEqual([
        'Louca',
        'Quase Nua',
        'Repente',
        'QZNJX2081700',
        'BXKZM1900338',
      ]);
    });

    it('shows each track with its ISRC, release date, duration and availability in Brazil', async () => {
      const { fixture } = await loaded([LOUCA, REPENTE]);

      const [louca, repente] = root(fixture).querySelectorAll('tbody tr');
      expect(text(louca)).toContain('DJ Malibu, MC Pack');
      expect(text(louca)).toContain('BXKZM1900345');
      expect(text(louca)).toContain('October 4, 2019');
      expect(text(louca)).toContain('02:04');
      expect(text(louca.querySelector('.badge'))).toContain('Available');
      expect(text(repente.querySelector('.badge'))).toContain('Unavailable');
    });

    it('sums up the catalog in the cards', async () => {
      const { fixture } = await loaded([LOUCA, QUASE, REPENTE, MISSING]);

      const values = [...root(fixture).querySelectorAll('.kpi__value')].map((value) => text(value));
      expect(values).toEqual(['4', '3', '2', '09:08']);
      expect(text(root(fixture).querySelector('.kpi'))).toContain('ISRCs looked up');
      expect(text(root(fixture).querySelector('figure'))).toContain('2013: 1');
    });

    it('puts the first track in the detail panel', async () => {
      const { fixture } = await loaded([QUASE, LOUCA]);

      expect(text(detail(fixture)?.querySelector('h2'))).toBe('Louca');
      expect(
        root(fixture)
          .querySelector('tbody tr.selected .track__title')
          ?.getAttribute('aria-current'),
      ).toBe('true');
    });

    it('shows the picked track in the detail panel', async () => {
      const { fixture } = await loaded([QUASE, LOUCA]);

      button(fixture, 'Quase Nua').click();
      await settle(fixture);

      expect(text(detail(fixture)?.querySelector('h2'))).toBe('Quase Nua');
      expect(text(detail(fixture))).toContain('Premonições');
      expect(text(detail(fixture))).toContain('August 27, 2015');
      expect(overlay()?.querySelector('orp-detail-sheet')).toBeFalsy();
    });

    it('speaks the language of the visitor', async () => {
      const { fixture } = await loaded([LOUCA], { language: Language.PT });

      expect(text(root(fixture).querySelector('h1'))).toBe('ISRCs ausentes');
      expect(text(root(fixture).querySelector('tbody tr'))).toContain('4 de outubro de 2019');
    });
  });

  describe('filters and order', () => {
    it('filters by the typed text and says how many are shown', async () => {
      const { fixture } = await loaded([LOUCA, QUASE, REPENTE]);

      await type(fixture, 'quase');

      expect(rowTitles(fixture)).toEqual(['Quase Nua']);
      expect(text(root(fixture).querySelector('.count'))).toBe('Showing 1 of 3');
    });

    it('says when nothing matches, and clears the filters on request', async () => {
      const { fixture } = await loaded([LOUCA, QUASE]);

      await type(fixture, 'pagode');
      expect(text(root(fixture).querySelector('.empty'))).toContain('Nothing matches “pagode”.');

      button(fixture, 'Clear the filters').click();
      await settle(fixture);

      expect(rowTitles(fixture)).toHaveLength(2);
    });

    it('clears the text from the field button, and gives the focus back to the field', async () => {
      const { fixture } = await loaded([LOUCA, QUASE]);
      await type(fixture, 'louca');

      (root(fixture).querySelector('.search__clear') as HTMLButtonElement).click();
      await settle(fixture);

      expect(rowTitles(fixture)).toHaveLength(2);
      expect(document.activeElement).toBe(root(fixture).querySelector('input[type="search"]'));
    });

    it('filters by status with the chips, which show their counts and which one is on', async () => {
      const { fixture } = await loaded([LOUCA, QUASE, REPENTE, MISSING]);

      const chip = button(fixture, 'Unavailable in BR');
      expect(text(chip)).toContain('1');
      chip.click();
      await settle(fixture);

      expect(rowTitles(fixture)).toEqual(['Repente']);
      expect(chip.getAttribute('aria-pressed')).toBe('true');
      expect(button(fixture, 'All').getAttribute('aria-pressed')).toBe('false');
    });

    it('says when no track has the chosen status', async () => {
      const { fixture } = await loaded([LOUCA]);

      button(fixture, 'Not found').click();
      await settle(fixture);

      expect(text(root(fixture).querySelector('.empty'))).toContain('No tracks with this status.');
    });

    it('reverses the order by title', async () => {
      const { fixture } = await loaded([LOUCA, QUASE, REPENTE]);

      button(fixture, 'Title A–Z').click();
      await settle(fixture);

      expect(rowTitles(fixture)).toEqual(['Repente', 'Quase Nua', 'Louca']);
      expect(text(root(fixture).querySelector('.sort'))).toContain('Title Z–A');
    });
  });

  describe('copying ISRCs', () => {
    it('copies the ISRCs of all the tracks at once', async () => {
      const { fixture, copy } = await loaded([QUASE, LOUCA, MISSING]);

      button(fixture, 'Copy all ISRCs').click();

      expect(copy).toHaveBeenCalledWith('BXKZM1900345\nBR1SP1500002');
    });

    it('copies the ISRC of the track in focus', async () => {
      const { fixture, copy } = await loaded([LOUCA]);

      (detail(fixture)?.querySelector('orp-copy-button button') as HTMLButtonElement).click();

      expect(copy).toHaveBeenCalledWith('BXKZM1900345');
    });

    it('lists the ISRCs Spotify does not know in a dialog', async () => {
      const { fixture } = await loaded([LOUCA, MISSING]);

      button(fixture, 'ISRCs not in our database: 1').click();
      await settle(fixture);

      const dialog = overlay().querySelector('[role="dialog"]') as HTMLElement;
      expect(text(dialog)).toContain('ISRCs not in our database');
      expect(text(dialog)).toContain('QZNJX2081700');
      expect(text(dialog)).not.toContain('Try again');
    });
  });

  describe('when some ISRCs failed', () => {
    it('warns, lists them in a dialog and looks them up again on request', async () => {
      const { fixture, requests } = await loaded([LOUCA, FAILED]);

      expect(text(root(fixture).querySelector('.partial'))).toContain('ISRCs affected: 1');
      button(fixture, 'Show affected ISRCs').click();
      await settle(fixture);
      const dialog = overlay().querySelector('[role="dialog"]') as HTMLElement;
      expect(text(dialog)).toContain('BXKZM1900338');

      [...dialog.querySelectorAll('button')]
        .find((candidate) => text(candidate)?.includes('Try again'))
        ?.click();
      await settle(fixture);

      answer(requests[1], [LOUCA]);
      await settle(fixture);
      expect(root(fixture).querySelector('.partial')).toBeNull();
    });
  });

  describe('when Spotify cannot be reached', () => {
    it('says so instead of the catalog, and tries again on request', async () => {
      const { fixture, requests } = await render();
      requests[0].error(new TracksUnavailableError());
      await settle(fixture);

      const alert = root(fixture).querySelector('[role="alert"]');
      expect(text(alert)).toContain('Music data unavailable');
      expect(root(fixture).querySelector('table')).toBeNull();

      button(fixture, 'Try again').click();
      await settle(fixture);
      answer(requests[1], [LOUCA]);
      await settle(fixture);

      expect(rowTitles(fixture)).toEqual(['Louca']);
    });
  });

  describe('preview', () => {
    it('plays the track in focus on request, and stops when another track is picked', async () => {
      const { fixture, spotify } = await loaded([LOUCA, QUASE]);

      button(fixture, 'Listen to a preview').click();
      await settle(fixture);
      expect(TestBed.inject(NowPlayingService).track()?.title).toBe('Louca');
      expect(detail(fixture)?.querySelector('orp-spotify-preview')).not.toBeNull();
      expect(spotify.load).toHaveBeenCalled();

      button(fixture, 'Quase Nua').click();
      await settle(fixture);

      expect(TestBed.inject(NowPlayingService).track()).toBeNull();
      expect(detail(fixture)?.querySelector('orp-spotify-preview')).toBeNull();
    });

    it('stops on request', async () => {
      const { fixture } = await loaded([LOUCA]);
      button(fixture, 'Listen to a preview').click();
      await settle(fixture);

      button(fixture, "Close Spotify's official player").click();
      await settle(fixture);

      expect(TestBed.inject(NowPlayingService).track()).toBeNull();
    });
  });

  describe('on a phone', () => {
    it('opens the detail of the picked track in a sheet, which closes on request', async () => {
      const { fixture } = await loaded([LOUCA, QUASE], { phone: true });

      button(fixture, 'Quase Nua').click();
      await settle(fixture);

      const sheet = overlay().querySelector('[role="dialog"]') as HTMLElement;
      expect(sheet.getAttribute('aria-labelledby')).toBe('detail-sheet-title');
      expect(text(sheet.querySelector('#detail-sheet-title'))).toBe('Quase Nua');

      (sheet.querySelector('button[aria-label="Close the details"]') as HTMLButtonElement).click();
      await settle(fixture);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(overlay().querySelector('orp-detail-sheet')).toBeNull();
    });

    it('has no detail panel beside the table, and stops the preview when the sheet closes', async () => {
      const { fixture } = await loaded([LOUCA], { phone: true });
      expect(detail(fixture)).toBeNull();

      button(fixture, 'Louca').click();
      await settle(fixture);
      const sheet = overlay().querySelector('[role="dialog"]') as HTMLElement;
      [...sheet.querySelectorAll('button')]
        .find((candidate) => text(candidate)?.includes('Listen to a preview'))
        ?.click();
      await settle(fixture);
      expect(TestBed.inject(NowPlayingService).track()?.title).toBe('Louca');

      (sheet.querySelector('button[aria-label="Close the details"]') as HTMLButtonElement).click();
      await settle(fixture);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(TestBed.inject(NowPlayingService).track()).toBeNull();
    });
  });
});
