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
    return 'BQApk4y4OKzbSgDrwjn-c7Slv3mDUU393Ha8pfue-CdytL8uvjicJS9so70FuxOnobi8xLGoK-FNw1w_FDPqQs1n6GvFWUCb3GeaEHGNts8jGMmPKzs';
  }

  getArtistData(artistId: string): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getAccessToken()}`,
    });
    console.log(headers);
    return this.http.get(`${this.apiUrl}/artists/${artistId}`, { headers });
  }
}
