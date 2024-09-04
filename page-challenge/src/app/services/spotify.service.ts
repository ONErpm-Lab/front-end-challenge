import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AllTrack } from '../interfaces/track.intercafe';

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

  getTrackByISRC(isrc: string): Observable<AllTrack> {
    const url = `${this.baseUrl}/search?q=isrc:${isrc}&type=track`;
    const headers = this.getHeaders();
    return this.http.get<AllTrack>(url, { headers });
  }
}