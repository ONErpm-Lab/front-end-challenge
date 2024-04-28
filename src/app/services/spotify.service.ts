import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';

import { AccessToken, SearchContent } from 'spotify-types';
import { environment } from '../../environments/environment';
import { endpoints } from '../core/endpoints';
import formatTracks from '../helpers/format-track/format-track.helper';
import { sortTracks } from '../helpers/sort-tracks/sort-track.helper';
import MultiTrack from './multi-track.interface';

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

  public getAllTracks(isrcArray: string[]): Observable<MultiTrack[]> {
    const tracks$ = isrcArray.map((isrc) => this.getTrack(isrc));

    return forkJoin(tracks$).pipe(
      map((tracks, index) =>
        tracks.map((track) => ({
          isrc: isrcArray[index],
          tracks: formatTracks(track.tracks!.items),
        }))
      ),
      map((multiTrack) => multiTrack.sort(sortTracks))
    );
  }
}
