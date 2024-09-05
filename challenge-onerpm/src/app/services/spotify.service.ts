import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class SpotifyService {
  private clientId = environment.API_DEV_CLIENT_ID;
  private clientSecret = environment.API_DEV_CLIENT_SECRET;
  private tokenUrl = 'https://accounts.spotify.com/api/token';
  private searchUrl = 'https://api.spotify.com/v1/search';

  private token: string | undefined;

  constructor(private http: HttpClient) { }

  authenticate(): Observable<string> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + btoa(this.clientId + ':' + this.clientSecret),
    });  

    const body = new URLSearchParams({
      grant_type: 'client_credentials'
    }).toString();

    return this.http.post<{ access_token: string }>(this.tokenUrl, body, { headers }).pipe(
      map((response) => {
        this.token = response.access_token;
        return this.token;
      })
    );
  }

  searchTrackByISRC(isrc: string): Observable<any> {
    if (!this.token){
      throw new Error('Token não disponível');
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.token}`,
    });

    const params = new HttpParams()
      .set('q', `isrc:${isrc}`)
      .set('type', 'track');

    return this.http.get(this.searchUrl, { headers, params}).pipe(map((response) => {
      return response;
    }));
  }
}