import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SpotifyService {
  private apiUrl = 'https://api.spotify.com/v1';
  private token =
    'BQBgSxhamqn0C6N0CUdqa-vEDlTWoPZNEAmWsUIpje4Ete5GI2FqZKUP1QIrYPFW__k2VAAnUGtEHeiQI8N7eo7GiFiBkIIRFLA1zwtwOZF0GqDqn8g';

  constructor(private http: HttpClient) {}

  getArtistData(artistId: string): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.token}`,
    });
    console.log(headers);
    return this.http.get(`${this.apiUrl}/artists/${artistId}`, { headers });
  }

  getTrackData(isrc: string): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.token}`,
    });
    return this.http.get(`${this.apiUrl}/search?q=isrc:${isrc}&type=track`, {
      headers,
    });
  }
}
