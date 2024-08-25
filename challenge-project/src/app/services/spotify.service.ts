import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SpotifyService {
  private apiUrl = 'https://api.spotify.com/v1';
  private token =
    'BQA3CNwYiwO1YLIRTp8A8AuBGXsTg5KLHaZIi_ce7ef4IP5diOngChqlbMgBzMSHGC_sjhCiOurujxORxHJcBPVMN_dZlj4Vf-ap9HvO58oDmNBfufw';

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
