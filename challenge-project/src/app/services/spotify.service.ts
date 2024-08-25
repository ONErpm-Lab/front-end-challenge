import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SpotifyService {
  private apiUrl = 'https://api.spotify.com/v1';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.getAccessToken();
    return new HttpHeaders({
      Authorization: `Bearer${token}`,
      'Content-Type': 'application/json',
    });
  }

  private getAccessToken(): string {
    return 'BQA3CNwYiwO1YLIRTp8A8AuBGXsTg5KLHaZIi_ce7ef4IP5diOngChqlbMgBzMSHGC_sjhCiOurujxORxHJcBPVMN_dZlj4Vf-ap9HvO58oDmNBfufw';
  }

  getArtistData(artistId: string): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getAccessToken()}`,
    });
    console.log(headers);
    return this.http.get(`${this.apiUrl}/artists/${artistId}`, { headers });
  }

  getTrackData(isrc: string): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getAccessToken()}`,
    });
    return this.http.get(`${this.apiUrl}/search?q=isrc:${isrc}&type=track`, {
      headers,
    });
  }
}
