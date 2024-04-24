import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AccessToken } from 'spotify-types';
import { environment } from '../../environments/environment';
import { endpoints } from '../core/endpoints';

import { SearchContent } from 'spotify-types';

@Injectable({
  providedIn: 'root',
})
export class SpotifyService {
  private http = inject(HttpClient);

  public getAccessToken(): Observable<AccessToken> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });

    const body = `grant_type=client_credentials&client_id=${environment.spotifyClientID}&client_secret=${environment.spotifyClientSecret}`;

    return this.http.post<AccessToken>(endpoints.accessToken, body, {
      headers,
    });
  }

  public getTrack(isrc: string) {
    const params = new HttpParams({
      fromObject: {
        q: `${isrc}`,
        type: 'track',
        limit: 5,
      },
    });

    return this.http.get<SearchContent>(endpoints.search, { params });
  }
}
