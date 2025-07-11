import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly tokenKey =  'token';

  saveToken(token: string): void {
    sessionStorage.setItem(this.tokenKey, JSON.stringify(token));
  }

  getToken(token: string): string | null {
    return sessionStorage.getItem(this.tokenKey);
  }
}
