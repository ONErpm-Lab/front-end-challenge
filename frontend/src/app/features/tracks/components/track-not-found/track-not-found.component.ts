import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IconComponent } from '@shared/icons/icon.component';
import type { Isrc } from '../../models/isrc.value-object';

/**
 * Lugar reservado na grade para um ISRC do contrato sem faixa exibida:
 * o Spotify não o encontrou, ou a consulta falhou.
 */
@Component({
  selector: 'app-track-not-found',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ghost' },
  template: `
    <div class="ghost__art" aria-hidden="true">
      <app-icon [name]="reason() === 'failed' ? 'alert' : 'search'" [size]="28" />
    </div>
    <div class="ghost__body">
      @if (reason() === 'failed') {
        <h2 class="ghost__title">Não foi possível consultar</h2>
        <p class="ghost__text">O Spotify não respondeu para este código.</p>
      } @else {
        <h2 class="ghost__title">Não encontrada no Spotify</h2>
        <p class="ghost__text">Nenhuma gravação com este código.</p>
      }
      <p class="ghost__isrc">
        <abbr title="International Standard Recording Code">ISRC</abbr> {{ label() }}
      </p>
    </div>
  `,
  styleUrl: './track-not-found.component.scss',
})
export class TrackNotFoundComponent {
  readonly isrc = input.required<Isrc>();
  readonly reason = input<'not-found' | 'failed'>('not-found');

  protected readonly label = computed(() => this.isrc().format());
}
