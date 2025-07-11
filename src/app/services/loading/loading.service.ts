import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private _loading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public loading$: Observable<boolean> = this._loading.asObservable();

  private activeRequests = 0;

  startLoading() {
    this.activeRequests++;

    if (this.activeRequests === 1) {
      this._loading.next(true);
    }
  }

  stopLoading() {
    this.activeRequests--;

    if (this.activeRequests === 0) {
      this._loading.next(false);
    }
  }
}