import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { appError, type AppError } from '../../../core/errors/app-error';
import { ErrorNotifier } from '../../../core/errors/error-notifier';
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

  it('warns when fewer codes resolved than were requested', async () => {
    const fixture = setup([track()]);
    await fixture.whenStable();

    const alert = fixture.nativeElement.querySelector('[role="alert"]');
    expect(alert.textContent).toContain('não foram encontradas');
    expect(alert.textContent).toContain(String(REQUESTED_ISRCS.length - 1));
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

  it('reports the failure to the notifier so the shell can react to it too', async () => {
    const fixture = setup(appError('network', 'Sem conexão.'));
    await fixture.whenStable();

    expect(TestBed.inject(ErrorNotifier).error()?.kind).toBe('network');
  });
});
