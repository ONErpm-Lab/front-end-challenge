import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IBaseExtractResult } from '../models';

@Injectable()
export abstract class BaseExtractService<T> {
  readonly stateSubject = new BehaviorSubject<IBaseExtractResult<T>>({
    data: this.getInitialData(),
    loading: false,
    error: null,
  });

  readonly data$ = this.stateSubject.pipe(map((state) => state.data));
  readonly loading$ = this.stateSubject.pipe(map((state) => state.loading));
  readonly error$ = this.stateSubject.pipe(map((state) => state.error));
  readonly state$ = this.stateSubject.asObservable();

  abstract getInitialData(): T;

  updateState(partial: Partial<IBaseExtractResult<T>>): void {
    const currentState = this.stateSubject.value;
    this.stateSubject.next({ ...currentState, ...partial });
  }

  setLoading(loading: boolean): void {
    this.updateState({ loading });
  }

  setError(error: string | null): void {
    this.updateState({ error, loading: false });
  }

  setData(data: T): void {
    this.updateState({ data, loading: false, error: null });
  }

  clearError(): void {
    this.updateState({ error: null });
  }
}
