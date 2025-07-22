import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Track } from './track.model';

/**
 * Componente responsável por exibir os detalhes de uma faixa individual.
 * Pode ser reutilizado para compor listas ou visualizações isoladas.
 */
@Component({
  selector: 'app-track-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './track-card.component.html',
  styleUrls: ['./track-card.component.scss'],
})
export class TrackCardComponent {
  /**
   * Faixa a ser exibida no card.
   * É obrigatório para renderização do componente.
   */
  @Input({ required: true }) track!: Track;

  /**
   * Retorna a duração formatada da faixa no formato mm:ss.
   * Exemplo: 3 minutos e 5 segundos → "3:05"
   */
  get formattedDuration(): string {
    const totalSeconds = Math.floor(this.track.durationMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    // Garante que segundos sempre tenham dois dígitos
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}
