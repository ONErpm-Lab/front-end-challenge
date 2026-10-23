import { DestroyRef, inject, Injectable, signal } from '@angular/core';

/**
 * Um único player ativo na página: o <audio> das prévias ou o player incorporado do Spotify
 * (para faixas sem `preview_url`). Abrir um fecha o outro, como em qualquer app de música.
 */
@Injectable({ providedIn: 'root' })
export class AudioPreviewService {
  private readonly audio = typeof Audio !== 'undefined' ? new Audio() : null;

  readonly currentIsrc = signal<string | null>(null);
  readonly progress = signal(0);
  /** Faixa com o player incorporado do Spotify aberto. */
  readonly embedIsrc = signal<string | null>(null);

  constructor() {
    if (!this.audio) return;
    const audio = this.audio;
    audio.preload = 'none';
    audio.addEventListener('timeupdate', () =>
      this.progress.set(audio.duration ? audio.currentTime / audio.duration : 0),
    );
    audio.addEventListener('ended', () => this.reset());
    audio.addEventListener('error', () => this.reset());
    inject(DestroyRef).onDestroy(() => audio.pause());
  }

  toggle(isrc: string, url: string): void {
    if (!this.audio) return;
    this.embedIsrc.set(null);
    if (this.currentIsrc() === isrc) {
      this.audio.pause();
      this.reset();
      return;
    }
    this.audio.src = url;
    this.progress.set(0);
    this.currentIsrc.set(isrc);
    this.audio.play().catch(() => this.reset());
  }

  /** Abre o player incorporado desta faixa (pausando a prévia) ou o fecha, se já estiver aberto. */
  toggleEmbed(isrc: string): void {
    if (this.embedIsrc() === isrc) {
      this.embedIsrc.set(null);
      return;
    }
    this.audio?.pause();
    this.reset();
    this.embedIsrc.set(isrc);
  }

  private reset(): void {
    this.currentIsrc.set(null);
    this.progress.set(0);
  }
}
