import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { appError, type AppError } from '../../../core/errors/app-error';
import { REQUESTED_ISRCS } from '../domain/isrc-catalog';
import type { Track } from '../domain/track';
import { TrackRepository } from '../domain/track-repository';
import { FakeTrackRepository } from '../testing/fake-track-repository';
import { track } from '../testing/track.fixtures';
import { TracksPage } from './tracks-page';

/**
 * Container tests go through the abstract contract only — no HTTP, no Spotify.
 * That is the practical payoff of depending on `TrackRepository` rather than on
 * `SpotifyTrackRepository`.
 */
function setup(result: readonly Track[] | AppError) {
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      { provide: TrackRepository, useValue: new FakeTrackRepository(result) },
    ],
  });

  return TestBed.createComponent(TracksPage);
}

/** A full batch, so the "some codes went missing" warning stays quiet. */
const fullBatch = (): Track[] =>
  REQUESTED_ISRCS.map((isrc, index) => track({ isrc, id: `id-${index}`, title: `Faixa ${index}` }));

const titlesOf = (el: HTMLElement): string[] =>
  Array.from(el.querySelectorAll('onerpm-track-card h2')).map((h) => h.textContent?.trim() ?? '');

describe('TracksPage', () => {
  it('renders a card per track, sorted alphabetically by title', async () => {
    const fixture = setup([
      track({ isrc: 'a', id: 'a', title: 'Zumbi' }),
      track({ isrc: 'b', id: 'b', title: 'Alegria' }),
      track({ isrc: 'c', id: 'c', title: 'Marimbondo' }),
    ]);
    await fixture.whenStable();

    expect(titlesOf(fixture.nativeElement)).toEqual(['Alegria', 'Marimbondo', 'Zumbi']);
  });

  it('names every ISRC that Spotify returned nothing for', async () => {
    const [resolved, ...unresolved] = REQUESTED_ISRCS;
    const fixture = setup([track({ isrc: resolved })]);
    await fixture.whenStable();

    const alert = fixture.nativeElement.querySelector('[role="alert"]');
    expect(alert.textContent).toContain('não retornaram');

    // The codes are the actionable part: this closes a contract over specific ISRCs.
    for (const isrc of unresolved) {
      expect(alert.textContent).toContain(isrc);
    }
    expect(alert.textContent).not.toContain(resolved);
  });

  it('uses the singular when exactly one code is unresolved', async () => {
    const resolved = REQUESTED_ISRCS.slice(0, -1).map((isrc, i) =>
      track({ isrc, id: `id-${i}`, title: `Faixa ${i}` }),
    );
    const fixture = setup(resolved);
    await fixture.whenStable();

    const alert = fixture.nativeElement.querySelector('[role="alert"]');
    expect(alert.textContent).toContain('1 dos 10 códigos ISRC não retornou');
    expect(alert.textContent).toContain(REQUESTED_ISRCS[REQUESTED_ISRCS.length - 1]);
  });

  it('renders no alert when every code resolved', async () => {
    const fixture = setup(fullBatch());
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeFalsy();
    expect(titlesOf(fixture.nativeElement)).toHaveLength(REQUESTED_ISRCS.length);
  });

  it('explains an empty result instead of rendering a bare page', async () => {
    const fixture = setup([]);
    await fixture.whenStable();

    const alert = fixture.nativeElement.querySelector('[role="alert"]');
    expect(alert.textContent).toContain('Nenhuma faixa encontrada');
    expect(titlesOf(fixture.nativeElement)).toHaveLength(0);
  });

  it('shows an alert when the provider is unavailable, as the spec requires', async () => {
    const fixture = setup(
      appError('provider', 'O provedor de faixas está indisponível no momento.'),
    );
    await fixture.whenStable();

    const alert = fixture.nativeElement.querySelector('[role="alert"]');
    expect(alert).toBeTruthy();
    expect(alert.textContent).toContain('indisponível');
    expect(titlesOf(fixture.nativeElement)).toHaveLength(0);
  });
});
