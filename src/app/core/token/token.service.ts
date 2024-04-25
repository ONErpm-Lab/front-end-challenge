import { Injectable } from '@angular/core';
import { BehaviorSubject, switchMap, take, timer } from 'rxjs';
import { AccessToken } from 'spotify-types';

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  private tokenSubject = new BehaviorSubject<AccessToken | null>(null);

  public getToken(): AccessToken | null {
    return this.tokenSubject.value;
  }

  public setToken(token: AccessToken): void {
    this.tokenSubject.next(token);

    this.tokenSubject
      .pipe(switchMap(() => timer(token.expires_in * 1000).pipe(take(1))))
      .subscribe(() => {
        this.clearToken();
      });
  }

  private clearToken(): void {
    this.tokenSubject.next(null);
  }
}
