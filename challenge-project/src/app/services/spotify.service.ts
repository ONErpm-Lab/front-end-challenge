import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SpotifyService {
  private apiUrl = 'https://api.spotify.com/v1';
  private token =
    'BQAkR4UoxWMfDMK_YzMilHcwUFHvRi3uuZp4s-HZs_vzw0TFCeBjyXogd5csdKsnkQDaBot7gkb1eMlyINPQs3TN5J2eiz2oO-mTAN74LNZnLzz7GF4';

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
