import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SpotifyService {
  private baseUrl = environment.spotify.baseUrl;
  private accessToken = environment.accessToken;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json'
    });
  }

  getTrackByISRC(isrc: string): Observable<any> {
    const url = `${this.baseUrl}/search?q=isrc:${isrc}&type=track`;
    return this.http.get(url, { headers: this.getHeaders()});
  }

}
