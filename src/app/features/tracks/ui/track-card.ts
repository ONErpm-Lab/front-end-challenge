import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DurationPipe } from '../../../shared/pipes/duration.pipe';
import { ReleaseDatePipe } from '../../../shared/pipes/release-date.pipe';
import { Badge } from '../../../shared/ui/badge/badge';
import type { Track } from '../domain/track';
import { TrackPlayer } from './track-player';

/**
 * Presentational card for one track: renders the eight fields the brief asks for and
 * holds no state, no services and no knowledge of where the data came from.
 */
@Component({
  selector: 'onerpm-track-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage, Badge, DurationPipe, ReleaseDatePipe, TrackPlayer],
  template: `
    <article
      class="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
    >
      <div class="relative aspect-square w-full bg-slate-100">
        @if (track().albumImageUrl; as cover) {
          <img
            [ngSrc]="cover"
            fill
            [priority]="priority()"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            [alt]="'Capa do álbum de ' + track().title"
            class="object-cover"
          />
        } @else {
          <div
            class="flex h-full w-full items-center justify-center text-slate-400"
            role="img"
            [attr.aria-label]="'Sem capa disponível para ' + track().title"
          >
            <span class="text-4xl" aria-hidden="true">♪</span>
          </div>
        }
      </div>

      <div class="flex flex-1 flex-col gap-3 p-4">
        <header>
          <h2 class="text-base leading-snug font-semibold text-balance text-slate-900">
            {{ track().title }}
          </h2>
          <p class="mt-1 text-sm text-slate-600">{{ artists() }}</p>
        </header>

        <dl class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
          <div class="flex items-center gap-1.5">
            <dt class="sr-only">Data de lançamento</dt>
            <dd>{{ track().releaseDate | releaseDate: track().releaseDatePrecision }}</dd>
          </div>
          <div class="flex items-center gap-1.5">
            <dt class="sr-only">Duração</dt>
            <dd>{{ track().durationMs | duration }}</dd>
          </div>
        </dl>

        <onerpm-badge [tone]="track().availableInTargetMarket ? 'positive' : 'negative'">
          {{ track().availableInTargetMarket ? 'Disponível no Brasil' : 'Indisponível no Brasil' }}
        </onerpm-badge>

        <div class="mt-auto flex flex-col gap-3 pt-1">
          <onerpm-track-player
            [trackId]="track().id"
            [title]="track().title"
            [previewUrl]="track().previewUrl"
          />

          <a
            class="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
            [href]="track().spotifyUrl"
            target="_blank"
            rel="noopener noreferrer"
          >
            Abrir no Spotify
            <span aria-hidden="true">↗</span>
            <span class="sr-only">(abre em nova aba)</span>
          </a>
        </div>
      </div>
    </article>
  `,
})
export class TrackCard {
  readonly track = input.required<Track>();
  /** Set on the first row so Angular can preload the likely LCP image. */
  readonly priority = input(false);

  /** Joined here rather than in the template so the markup stays declarative. */
  protected readonly artists = computed(
    () => this.track().artists.join(', ') || 'Artista desconhecido',
  );
}
