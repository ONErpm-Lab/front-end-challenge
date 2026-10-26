import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TrackLookupResult } from '../../../../../contract/tracks.types';
import { i18nTestProviders, useLanguage } from '../../../../testing/i18n-testing';
import { TracksApi } from '../../api/tracks-api';
import { TracksStore } from '../../store/tracks-store';
import { foundResult, notFoundResult } from '../../testing/builders';
import { TracksToolbar } from './tracks-toolbar';

async function render(results: readonly TrackLookupResult[], query = '') {
  TestBed.configureTestingModule({
    imports: [TracksToolbar],
    providers: [
      ...i18nTestProviders,
      { provide: TracksApi, useValue: { lookup: () => of(results) } },
    ],
  });
  await useLanguage();
  TestBed.inject(TracksStore);
  for (let round = 0; round < 3; round++) {
    TestBed.tick();
    await new Promise<void>((resolve) => setTimeout(resolve));
  }
  const fixture = TestBed.createComponent(TracksToolbar);
  fixture.componentRef.setInput('query', query);
  fixture.componentRef.setInput('visibleCount', results.length);
  await fixture.whenStable();
  return fixture;
}

const root = (fixture: ComponentFixture<TracksToolbar>) => fixture.nativeElement as HTMLElement;
const text = (fixture: ComponentFixture<TracksToolbar>, selector: string) =>
  root(fixture).querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim();

describe('TracksToolbar', () => {
  beforeEach(() => localStorage.clear());

  it('says how many tracks Spotify has', async () => {
    const fixture = await render([foundResult('B'), foundResult('A'), notFoundResult('X')]);

    expect(text(fixture, '.toolbar__summary')).toBe('Tracks on Spotify: 2');
  });

  it('counts the list the filter shows while filtering', async () => {
    const fixture = await render([foundResult('B'), foundResult('A')], 'a');

    expect(text(fixture, '.toolbar__summary')).toContain('2');
    expect(text(fixture, '.toolbar__summary')).not.toBe('Tracks on Spotify: 2');
  });

  it('writes what the visitor types into the two-way query', async () => {
    const fixture = await render([foundResult('A')]);
    const input = root(fixture).querySelector('input') as HTMLInputElement;

    input.value = 'abc';
    input.dispatchEvent(new Event('input'));

    expect(fixture.componentInstance.query()).toBe('abc');
  });

  it('clears the filter on Escape and on the clear button, keeping the focus in the field', async () => {
    const fixture = await render([foundResult('A')], 'abc');
    document.body.append(root(fixture));
    const input = root(fixture).querySelector('input') as HTMLInputElement;

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();

    expect(fixture.componentInstance.query()).toBe('');
    expect(document.activeElement).toBe(input);
    root(fixture).remove();
  });

  it('reverses the order of the list', async () => {
    const fixture = await render([foundResult('A'), foundResult('B')]);
    const store = TestBed.inject(TracksStore);
    const before = store.direction();

    (root(fixture).querySelector('.toolbar__sort') as HTMLButtonElement).click();

    expect(store.direction()).not.toBe(before);
  });

  it('offers the ISRCs that are not in the database only when there are some', async () => {
    const without = await render([foundResult('A')]);
    expect(root(without).querySelector('.toolbar__missing')).toBeNull();

    TestBed.resetTestingModule();
    const fixture = await render([foundResult('A'), notFoundResult('X')]);
    const requested = vi.fn();
    fixture.componentInstance.missingRequested.subscribe(requested);

    (root(fixture).querySelector('.toolbar__missing') as HTMLButtonElement).click();

    expect(requested).toHaveBeenCalledTimes(1);
  });
});
