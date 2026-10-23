import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { IconComponent } from '@shared/icons/icon.component';

let nextId = 0;

/**
 * Etiqueta compacta com explicação sob demanda: o rótulo fica sempre visível,
 * o detalhe abre num balão ao clicar (ou Enter/Espaço) e fecha com Esc ou clique fora.
 * Para contexto e limitações; erros que exigem ação continuam em <app-alert>.
 */
@Component({
  selector: 'app-info-chip',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './info-chip.component.html',
  styleUrl: './info-chip.component.scss',
  host: {
    '[class]': '"info-chip info-chip--" + tone()',
    '(document:click)': 'closeIfOutside($event)',
    '(keydown.escape)': 'close()',
  },
})
export class InfoChipComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly label = input.required<string>();
  readonly heading = input.required<string>();
  readonly tone = input<'warn' | 'muted'>('muted');

  protected readonly open = signal(false);
  protected readonly panelId = `info-chip-${nextId++}`;

  protected toggle(): void {
    this.open.update((value) => !value);
  }

  protected close(): void {
    this.open.set(false);
  }

  protected closeIfOutside(event: Event): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) this.close();
  }
}
