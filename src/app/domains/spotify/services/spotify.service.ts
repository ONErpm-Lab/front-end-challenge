import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { map, Observable, of, switchMap, tap } from 'rxjs';
import { ISpotifySearchResponse } from '../types/spotify.types';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SpotifyService {
  constructor(private http: HttpClient) {}
  hasToken = signal(false);
  token = signal('');

  getToken() {
    if (this.hasToken()) {
      return of(this.token());
    }

    const body = new URLSearchParams();
    body.set('grant_type', 'client_credentials');
    body.set('client_id', environment.spotifyClientId);
    body.set('client_secret', environment.spotifyClientSecret);

    return this.http
      .post<any>('https://accounts.spotify.com/api/token', body.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
      .pipe(
        tap((res) => {
          this.hasToken.set(true);
          this.token.set(res.access_token);
        }),
        map((res) => res.access_token)
      );
  }

  search(query: string, type: string, limit: number): Observable<ISpotifySearchResponse> {
    return this.getToken().pipe(
      switchMap((token) =>
        this.http.get<ISpotifySearchResponse>('https://api.spotify.com/v1/search', {
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
}
