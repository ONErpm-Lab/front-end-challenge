import { ReleaseDatePrecision } from '../../../../models/tracks.enums';
import { Language } from '../../../../core/i18n/i18n.enums';
import { StatusFilter } from '../../domain/domain.enums';
import { errorResult, foundResult, notFoundResult } from '../../testing/builders';
import { renderWithTracks, settle, text } from '../../testing/render-with-tracks';
import { TrackPick } from './tracks-table.interfaces';
import { TracksTableComponent } from './tracks-table.component';

const LOUCA = foundResult('Louca', {
  isrc: 'BXKZM1900345',
  artists: ['DJ Malibu', 'MC Pack'],
  releaseDate: { value: '2019-10-04', precision: ReleaseDatePrecision.DAY },
  durationMs: 124_315,
});
const REPENTE = foundResult('Repente', { isrc: 'BRC310600002', availableInBR: false });
const MISSING = notFoundResult('QZNJX2081700');
const FAILED = errorResult('BXKZM1900338');

const rows = (root: HTMLElement) => [...root.querySelectorAll('tbody tr')];

describe('TracksTableComponent', () => {
  it('is a table with a caption and a header per column', async () => {
    const { root } = await renderWithTracks(TracksTableComponent, [LOUCA]);

    expect(text(root.querySelector('caption'))).toBe('Tracks');
    expect([...root.querySelectorAll('th')].map((th) => text(th))).toEqual([
      'Track',
      'ISRC',
      'Released',
      'Duration',
      'Brazil',
      'Details',
    ]);
  });

  it('shows each track with artists, ISRC, release date, duration and availability', async () => {
    const { root } = await renderWithTracks(TracksTableComponent, [LOUCA, REPENTE]);

    const [louca, repente] = rows(root);
    expect(text(louca)).toContain('DJ Malibu, MC Pack');
    expect(text(louca)).toContain('BXKZM1900345');
    expect(text(louca)).toContain('October 4, 2019');
    expect(text(louca)).toContain('02:04');
    expect(text(louca.querySelector('.badge'))).toContain('Available');
    expect(text(repente.querySelector('.badge'))).toContain('Unavailable');
  });

  it('keeps the ISRCs without a track, after the tracks, saying why', async () => {
    const { root } = await renderWithTracks(TracksTableComponent, [FAILED, MISSING, LOUCA]);

    const [, missing, failed] = rows(root);
    expect(text(missing)).toContain('ISRC not found on Spotify');
    expect(text(missing.querySelector('.badge'))).toBe('Not found');
    expect(text(failed)).toContain('Could not load this ISRC');
    expect(text(failed.querySelector('.badge'))).toBe('Not loaded');
    expect(missing.querySelector('button')).toBeNull();
  });

  it('marks the track in focus and moves it to the one picked, telling the page', async () => {
    const { fixture, root, store } = await renderWithTracks(TracksTableComponent, [LOUCA, REPENTE]);
    const picks: TrackPick[] = [];
    fixture.componentInstance.picked.subscribe((pick) => picks.push(pick));
    expect(rows(root)[0].querySelector('button')?.getAttribute('aria-current')).toBe('true');

    const repente = rows(root)[1].querySelector('button') as HTMLButtonElement;
    expect(repente.getAttribute('aria-label')).toBe('Show details of Repente');
    repente.click();
    await settle(fixture);

    expect(store.selected()?.title).toBe('Repente');
    expect(picks).toEqual([{ isrc: 'BRC310600002', opener: repente }]);
    expect(rows(root)[1].classList).toContain('selected');
  });

  it('says how many tracks Spotify has, or how many are shown when filtered', async () => {
    const { fixture, root, store } = await renderWithTracks(TracksTableComponent, [
      LOUCA,
      REPENTE,
      MISSING,
    ]);
    expect(text(root.querySelector('.count'))).toBe('Tracks on Spotify: 2');

    store.setQuery('lou');
    await settle(fixture);

    expect(text(root.querySelector('.count'))).toBe('Showing 1 of 3');
  });

  it('says when nothing matches the text, and clears the filters on request', async () => {
    const { fixture, root, store } = await renderWithTracks(TracksTableComponent, [LOUCA]);

    store.setQuery('pagode');
    await settle(fixture);
    expect(text(root.querySelector('.empty'))).toContain('Nothing matches “pagode”.');
    (root.querySelector('.empty button') as HTMLButtonElement).click();
    await settle(fixture);

    expect(store.query()).toBe('');
    expect(rows(root)).toHaveLength(1);
  });

  it('says when no track has the chosen status', async () => {
    const { fixture, root, store } = await renderWithTracks(TracksTableComponent, [LOUCA]);

    store.setStatusFilter(StatusFilter.NOT_FOUND);
    await settle(fixture);

    expect(text(root.querySelector('.empty'))).toContain('No tracks with this status.');
  });

  it('formats dates in the language of the visitor', async () => {
    const { root } = await renderWithTracks(TracksTableComponent, [LOUCA], {
      language: Language.PT,
    });

    expect(text(rows(root)[0])).toContain('4 de outubro de 2019');
  });
});
