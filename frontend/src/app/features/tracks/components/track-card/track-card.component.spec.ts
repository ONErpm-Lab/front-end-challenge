import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { buildTrack } from '@testing/track.fixture';
import type { Track } from '../../models/track.model';
import { TrackCardComponent } from './track-card.component';

/** O botão de áudio do card tem três modos: prévia própria, player do Spotify ou nada a tocar. */
describe('TrackCardComponent (áudio)', () => {
  const render = async (track: Track) => {
    TestBed.configureTestingModule({
      imports: [TrackCardComponent],
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(TrackCardComponent);
    fixture.componentRef.setInput('track', track);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    return { fixture, el, button: el.querySelector('button.preview') as HTMLButtonElement };
  };

  /** A revelação é uma animação CSS; no teste, o fim dela é sinalizado à mão. */
  const finishAnimation = async (fixture: { whenStable(): Promise<unknown> }, el: HTMLElement) => {
    el.querySelector('app-card-player')?.dispatchEvent(
      new Event('animationend', { bubbles: true }),
    );
    await fixture.whenStable();
  };

  it('sem prévia, revela o player do Spotify sobre o card e o fecha com animação', async () => {
    const { fixture, el, button } = await render(buildTrack({ title: 'Louca', previewUrl: null }));

    expect(button.disabled).toBe(false);
    expect(button.getAttribute('aria-label')).toBe('Ouvir "Louca" no player do Spotify');
    expect(el.querySelector('app-card-player')).toBeNull();

    button.click();
    await fixture.whenStable();
    const region = el.querySelector('app-card-player');
    expect(region?.getAttribute('role')).toBe('region');
    expect(region?.getAttribute('aria-label')).toBe('Player do Spotify: Louca');
    expect(button.getAttribute('aria-pressed')).toBe('true');
    // O iframe só entra quando a revelação termina: nunca dentro de uma animação.
    expect(el.querySelector('iframe')).toBeNull();

    await finishAnimation(fixture, el);
    const iframe = el.querySelector('iframe');
    expect(iframe?.getAttribute('src')).toBe(
      'https://open.spotify.com/embed/track/4s71Bub5KzXBSMyE8nlH4E?theme=0',
    );
    expect(iframe?.getAttribute('title')).toBe('Player do Spotify: Louca');
    const close = el.querySelector<HTMLButtonElement>('app-card-player button');
    expect(document.activeElement).toBe(close);

    close?.click();
    await fixture.whenStable();
    expect(region?.classList).toContain('is-closing');
    expect(el.querySelector('iframe')).toBeNull();

    await finishAnimation(fixture, el);
    expect(el.querySelector('app-card-player')).toBeNull();
    expect(document.activeElement).toBe(button);
    expect(button.getAttribute('aria-pressed')).toBe('false');
  });

  it('abre e fecha mesmo se a animação não terminar (aba em segundo plano)', async () => {
    const { fixture, el, button } = await render(buildTrack({ previewUrl: null }));
    vi.useFakeTimers();
    try {
      button.click();
      fixture.detectChanges();

      vi.advanceTimersByTime(800);
      fixture.detectChanges();
      expect(el.querySelector('iframe')).not.toBeNull();

      el.querySelector<HTMLButtonElement>('app-card-player button')?.click();
      fixture.detectChanges();
      vi.advanceTimersByTime(500);
      fixture.detectChanges();
      expect(el.querySelector('app-card-player')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('fecha o player com Esc', async () => {
    const { fixture, el, button } = await render(buildTrack({ previewUrl: null }));
    button.click();
    await fixture.whenStable();
    await finishAnimation(fixture, el);

    el.querySelector('app-card-player')?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    await fixture.whenStable();
    await finishAnimation(fixture, el);

    expect(el.querySelector('app-card-player')).toBeNull();
  });

  it('com prévia, usa o player próprio e não o do Spotify', async () => {
    const { button } = await render(buildTrack({ title: 'Faixa', previewUrl: '/p.wav' }));

    expect(button.getAttribute('aria-label')).toBe('Ouvir prévia de "Faixa"');
  });

  it('sem prévia e sem ID válido, desabilita o botão', async () => {
    const { el, button } = await render(buildTrack({ previewUrl: null, spotifyId: null }));

    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-label')).toContain('não fornecida pelo Spotify');
    expect(el.querySelector('iframe')).toBeNull();
  });
});
