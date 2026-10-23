import { NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
} from '@angular/core';
import { IconComponent } from '@shared/icons/icon.component';
import { DurationPipe } from '@shared/pipes/duration.pipe';
import { Isrc } from '../../models/isrc.value-object';
import type { Track } from '../../models/track.model';
import { formatReleaseDate } from '../../utils/format-release-date';
import { AudioPreviewService } from '../../services/audio-preview.service';
import { spotifyEmbedUrl } from '../../utils/spotify-embed-url';
import { AudioPreviewComponent } from '../audio-preview/audio-preview.component';
import { CardPlayerComponent } from '../card-player/card-player.component';

@Component({
  selector: 'app-track-card',
  imports: [
    AudioPreviewComponent,
    CardPlayerComponent,
    DurationPipe,
    IconComponent,
    NgOptimizedImage,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './track-card.component.html',
  styleUrl: './track-card.component.scss',
  host: { class: 'card' },
})
export class TrackCardComponent {
  private readonly player = inject(AudioPreviewService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly track = input.required<Track>();

  /** O player do Spotify só entra quando o Spotify não forneceu a prévia. */
  protected readonly embedUrl = computed(() =>
    this.track().previewUrl ? null : spotifyEmbedUrl(this.track().spotifyId),
  );
  protected readonly isEmbedOpen = computed(() => this.player.embedIsrc() === this.track().isrc);

  /** Centro do botão de áudio, relativo ao card: de onde nasce o círculo do player. */
  protected readonly playerOrigin = computed(() => {
    if (!this.isEmbedOpen()) return { x: 0, y: 0, radius: 0 };
    const card = this.host.nativeElement;
    const { width, height } = card.getBoundingClientRect();
    const button = card.querySelector('button.preview')?.getBoundingClientRect();
    const box = card.getBoundingClientRect();
    const x = button ? button.left - box.left + button.width / 2 : width / 2;
    const y = button ? button.top - box.top + button.height / 2 : height / 2;
    // Distância até o canto mais distante: o círculo cobre o card exatamente no fim.
    const radius = Math.hypot(Math.max(x, width - x), Math.max(y, height - y));
    return { x, y, radius };
  });

  /** Fim da animação de saída: fecha o player e devolve o foco ao botão da faixa. */
  protected onPlayerClosed(): void {
    this.player.toggleEmbed(this.track().isrc);
    this.host.nativeElement.querySelector<HTMLButtonElement>('button.preview')?.focus();
  }

  protected readonly releaseDate = computed(() =>
    formatReleaseDate(this.track().releaseDate, this.track().releaseDatePrecision),
  );
  protected readonly isrcLabel = computed(() => Isrc.create(this.track().isrc).format());
  protected readonly artists = computed(() => this.track().artists.join(', '));
}
