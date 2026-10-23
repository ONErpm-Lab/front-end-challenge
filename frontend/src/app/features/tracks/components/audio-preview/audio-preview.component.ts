import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { IconComponent } from '@shared/icons/icon.component';
import { AudioPreviewService } from '../../services/audio-preview.service';

@Component({
  selector: 'app-audio-preview',
  imports: [IconComponent, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './audio-preview.component.html',
  styleUrl: './audio-preview.component.scss',
  host: { '[class.is-playing]': 'isPlaying()' },
})
export class AudioPreviewComponent {
  private readonly player = inject(AudioPreviewService);

  readonly isrc = input.required<string>();
  readonly title = input.required<string>();
  readonly previewUrl = input<string | null>(null);
  /** Sem prévia, o botão abre o player incorporado do Spotify, se houver URL válida. */
  readonly embedUrl = input<string | null>(null);

  /** Prévia própria quando há `previewUrl`; senão, player do Spotify; senão, nada a tocar. */
  protected readonly mode = computed<'preview' | 'embed' | 'none'>(() =>
    this.previewUrl() ? 'preview' : this.embedUrl() ? 'embed' : 'none',
  );
  protected readonly isPlaying = computed(() => this.player.currentIsrc() === this.isrc());
  protected readonly isEmbedOpen = computed(() => this.player.embedIsrc() === this.isrc());
  protected readonly pressed = computed(() => {
    const mode = this.mode();
    return mode === 'preview' ? this.isPlaying() : mode === 'embed' ? this.isEmbedOpen() : null;
  });
  protected readonly progress = computed(() => (this.isPlaying() ? this.player.progress() : 0));
  protected readonly label = computed(() => {
    const mode = this.mode();
    if (mode === 'none') return `Prévia de "${this.title()}" não fornecida pelo Spotify`;
    if (mode === 'embed') {
      return this.isEmbedOpen()
        ? `Fechar o player do Spotify de "${this.title()}"`
        : `Ouvir "${this.title()}" no player do Spotify`;
    }
    return this.isPlaying()
      ? `Pausar prévia de "${this.title()}"`
      : `Ouvir prévia de "${this.title()}"`;
  });

  protected toggle(): void {
    const url = this.previewUrl();
    if (url) this.player.toggle(this.isrc(), url);
    else if (this.embedUrl()) this.player.toggleEmbed(this.isrc());
  }
}
