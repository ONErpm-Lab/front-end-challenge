import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IconComponent } from '@shared/icons/icon.component';

@Component({
  selector: 'app-alert',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './alert.component.html',
  styleUrl: './alert.component.scss',
  host: {
    // Erro interrompe o leitor de tela (alert); aviso parcial ou informativo espera a vez (status).
    '[attr.role]': 'tone() === "danger" ? "alert" : "status"',
    '[class]': '"alert alert--" + tone()',
  },
})
export class AlertComponent {
  readonly tone = input<'danger' | 'warn' | 'info'>('danger');
  readonly heading = input.required<string>();
  readonly actionLabel = input<string | null>(null);
  readonly action = output<void>();
}
