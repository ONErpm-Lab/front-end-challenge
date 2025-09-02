import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, tap, switchMap } from 'rxjs/operators';

import { ISpotifyTokenResponse } from '../../modules/tracks';

@Injectable({
  providedIn: 'root',
})
export class SpotifyAuthService {
  private readonly http = inject(HttpClient);

  private readonly tokenSubject = new BehaviorSubject<string | null>(null);
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  private readonly errorSubject = new BehaviorSubject<string | null>(null);

  readonly token$ = this.tokenSubject.asObservable();
  readonly loading$ = this.loadingSubject.asObservable();
  readonly error$ = this.errorSubject.asObservable();

  generateToken(): Observable<string> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    const body = new URLSearchParams();
    body.set('grant_type', 'client_credentials');

    const headers = new HttpHeaders()
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .set(
        'Authorization',
        `Basic ${btoa(
          `${process.env['SPOTIFY_CLIENT_ID']}:${process.env['SPOTIFY_CLIENT_SECRET']}`
        )}`
      );

    return this.http
      .post<ISpotifyTokenResponse>(process.env['SPOTIFY_TOKEN_URL'], body.toString(), {
        headers,
      })
      .pipe(
        tap((response) => {
          sessionStorage.setItem('spotifyToken', response.access_token);

          this.tokenSubject.next(response.access_token);
          this.loadingSubject.next(false);

          setTimeout(() => {
            this.generateToken();
          }, (response.expires_in - 60) * 1000);
        }),

        switchMap((response) => of(response.access_token))
      );
  }

  getToken(): Observable<string> {
    const currentToken = this.tokenSubject.value;

    if (currentToken) {
      return of(currentToken);
    }

    return this.generateToken();
  }

  clearToken(): void {
    this.tokenSubject.next(null);
  }

  clearError(): void {
    this.errorSubject.next(null);
  }

  hasValidToken(): boolean {
    return !!this.tokenSubject.value;
  }

  getCurrentToken(): string | null {
    return this.tokenSubject.value;
  }
}
