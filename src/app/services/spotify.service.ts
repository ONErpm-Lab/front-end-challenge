import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { AccessToken, SearchContent } from 'spotify-types';
import { environment } from '../../environments/environment';
import { endpoints } from '../core/endpoints';

@Injectable({
  providedIn: 'root',
})
export class SpotifyService {
  private http = inject(HttpClient);

  public generateAccessToken(): Observable<AccessToken> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoa(
        `${environment.spotifyClientID}:${environment.spotifyClientSecret}`
      )}`,
    });

    const body = 'grant_type=client_credentials';

    return this.http.post<AccessToken>(endpoints.accessToken, body, {
      headers,
    });
  }

  public getTrack(isrc: string): Observable<SearchContent> {
    const params = new HttpParams({
      fromObject: {
        q: `isrc:${isrc}`,
        type: 'track',
      },
    });

    return this.http.get<SearchContent>(endpoints.search, {
      params,
    });
  }
}
