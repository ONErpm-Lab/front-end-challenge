import { Injectable, signal } from '@angular/core';
import type { AppError } from './app-error';

/**
 * Backs the "alerta ao usuário" the spec requires when the provider is unavailable.
 *
 * Signal-based on purpose: this is view state, so it belongs to the signal half of
 * the RxJS/signals split (RxJS owns async, signals own what the template reads).
 */
@Injectable({ providedIn: 'root' })
export class ErrorNotifier {
  private readonly current = signal<AppError | null>(null);

  /** The error currently on screen, if any. */
  readonly error = this.current.asReadonly();

  notify(error: AppError): void {
    this.current.set(error);
  }

  dismiss(): void {
    this.current.set(null);
  }
}
