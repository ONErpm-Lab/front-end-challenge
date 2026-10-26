import { Clipboard } from '@angular/cdk/clipboard';
import { Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Language } from '../../../core/i18n/i18n.enums';
import { TrackLookupResult } from '../../../models/tracks.types';
import { TrackLookupService } from '../../../services/track-lookup/track-lookup.service';
import { i18nTestProviders, useLanguage } from '../../../../testing/i18n-testing';
import { TracksStore } from '../store/tracks.store';
import { fakeSpotify } from './fake-spotify';

/** Lets the store's resource and the rendering settle (never `whenStable()` while a lookup is pending). */
export async function settle<T>(fixture: ComponentFixture<T>): Promise<void> {
  for (let round = 0; round < 3; round++) {
    TestBed.tick();
    await new Promise<void>((resolve) => setTimeout(resolve));
    fixture.detectChanges();
  }
}

/**
 * Renders a component of the tracks feature with the real store, whose lookup answers `results` at once, real
 * translations, a fake Spotify player and a fake clipboard.
 */
export async function renderWithTracks<T>(
  component: Type<T>,
  results: readonly TrackLookupResult[],
  options: { language?: Language } = {},
) {
  const copy = vi.fn(() => true);
  const spotify = fakeSpotify();
  TestBed.configureTestingModule({
    providers: [
      ...i18nTestProviders,
      spotify.provider,
      { provide: TrackLookupService, useValue: { lookup: () => of(results) } },
      { provide: Clipboard, useValue: { copy } },
    ],
  });
  await useLanguage(options.language);
  const fixture = TestBed.createComponent(component);
  await settle(fixture);
  return {
    fixture,
    root: fixture.nativeElement as HTMLElement,
    store: TestBed.inject(TracksStore),
    copy,
    spotify,
  };
}

export const text = (element: Element | null | undefined) =>
  element?.textContent?.replace(/\s+/g, ' ').trim();
