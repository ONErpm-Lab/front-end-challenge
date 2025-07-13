import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { map, Observable, of, switchMap, tap, shareReplay, BehaviorSubject } from 'rxjs';
import { ISpotifySearchResponse } from '../types/spotify.types';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SpotifyService {
  constructor(private http: HttpClient) {}
  
  hasToken = signal(false);
  token = signal('');
  private tokenExpirationTime = signal<number>(0);
  private tokenRequest$: Observable<string> | null = null;
  private readonly TOKEN_EXPIRATION_BUFFER = 5 * 60 * 1000; // 5 minutos de buffer

  private isTokenExpired(): boolean {
    return Date.now() >= this.tokenExpirationTime();
  }

  private isTokenExpiringSoon(): boolean {
    return Date.now() >= (this.tokenExpirationTime() - this.TOKEN_EXPIRATION_BUFFER);
  }

  getToken(): Observable<string> {
    if (this.hasToken() && !this.isTokenExpired() && !this.isTokenExpiringSoon()) {
      return of(this.token());
    }

    if (this.tokenRequest$) {
      return this.tokenRequest$;
    }

    const body = new URLSearchParams();
    body.set('grant_type', 'client_credentials');
    body.set('client_id', environment.spotify.clientId);
    body.set('client_secret', environment.spotify.clientSecret);

    this.tokenRequest$ = this.http
      .post<any>(environment.spotify.endpoints.token, body.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
      .pipe(
        tap((res) => {
          this.hasToken.set(true);
          this.token.set(res.access_token);
          const expiresIn = res.expires_in || 3600;
          this.tokenExpirationTime.set(Date.now() + (expiresIn * 1000));
        }),
        map((res) => res.access_token),
        shareReplay(1), 
        tap(() => {
          this.tokenRequest$ = null;
        })
      );

    return this.tokenRequest$;
  }

  search(query: string, type: string, limit: number): Observable<ISpotifySearchResponse> {
    return this.getToken().pipe(
      switchMap((token) =>
        this.http.get<ISpotifySearchResponse>(environment.spotify.endpoints.search, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          params: {
            q: query,
            type: type,
            limit: limit.toString()
          }
        })
      )
    );
  }

  clearTokenCache(): void {
    this.hasToken.set(false);
    this.token.set('');
    this.tokenExpirationTime.set(0);
    this.tokenRequest$ = null;
  }
}
