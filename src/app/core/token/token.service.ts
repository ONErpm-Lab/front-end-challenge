import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, switchMap, take, timer } from 'rxjs';
import { AccessToken } from 'spotify-types';

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  private tokenSubject = new BehaviorSubject<AccessToken | null>(null);

  public getToken(): AccessToken | null {
    return this.tokenSubject.value;
  }

  public getToken$(): Observable<AccessToken | null> {
    return this.tokenSubject.asObservable();
  }

  public getTokenAsObservable(): Observable<AccessToken | null> {
    return this.tokenSubject.asObservable();
  }

  public setToken(token: AccessToken): void {
    this.tokenSubject.next(token);

    this.tokenSubject
      .pipe(switchMap(() => timer(token.expires_in * 1000).pipe(take(1))))
      .subscribe(() => {
        this.clearToken();
      });
  }

  public clearToken(): void {
    this.tokenSubject.next(null);
  }
}
