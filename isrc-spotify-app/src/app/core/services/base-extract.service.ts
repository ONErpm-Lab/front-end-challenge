import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IBaseExtractResult } from '../models';

@Injectable()
export abstract class BaseExtractService<T> {
  protected readonly stateSubject = new BehaviorSubject<IBaseExtractResult<T>>({
    data: this.getInitialData(),
    loading: false,
    error: null,
  });

  // Observables públicos
  readonly data$ = this.stateSubject.pipe(map((state) => state.data));
  readonly loading$ = this.stateSubject.pipe(map((state) => state.loading));
  readonly error$ = this.stateSubject.pipe(map((state) => state.error));
  readonly state$ = this.stateSubject.asObservable();

  /**
   * Método abstrato para obter dados iniciais
   */
  protected abstract getInitialData(): T;

  /**
   * Atualiza o estado interno
   */
  protected updateState(partial: Partial<IBaseExtractResult<T>>): void {
    const currentState = this.stateSubject.value;
    this.stateSubject.next({ ...currentState, ...partial });
  }

  /**
   * Define o estado de carregamento
   */
  protected setLoading(loading: boolean): void {
    this.updateState({ loading });
  }

  /**
   * Define o estado de erro
   */
  protected setError(error: string | null): void {
    this.updateState({ error, loading: false });
  }

  /**
   * Define os dados
   */
  protected setData(data: T): void {
    this.updateState({ data, loading: false, error: null });
  }

  /**
   * Limpa o estado de erro
   */
  clearError(): void {
    this.updateState({ error: null });
  }
}
