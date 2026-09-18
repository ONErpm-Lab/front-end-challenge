import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { appError, type AppError } from '../../../core/errors/app-error';
import { ErrorNotifier } from '../../../core/errors/error-notifier';
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

describe('TracksPage', () => {
  it('renders the tracks it receives, sorted by title', async () => {
    const fixture = setup([track({ title: 'Zumbi' }), track({ title: 'Alegria' })]);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('2 faixa(s)');
  });

  it('shows an alert when the provider is unavailable, as the spec requires', async () => {
    const fixture = setup(
      appError('provider', 'O provedor de faixas está indisponível no momento.'),
    );
    await fixture.whenStable();

    const alert = fixture.nativeElement.querySelector('[role="alert"]');
    expect(alert).toBeTruthy();
    expect(alert.textContent).toContain('indisponível');
  });

  it('reports the failure to the notifier so the shell can react to it too', async () => {
    const fixture = setup(appError('network', 'Sem conexão.'));
    await fixture.whenStable();

    expect(TestBed.inject(ErrorNotifier).error()?.kind).toBe('network');
  });

  it('renders no alert on the happy path', async () => {
    const fixture = setup([track()]);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeFalsy();
  });
});
