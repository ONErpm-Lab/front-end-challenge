import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class ApiSpotifyService {
  private readonly URL_API = "https://api.spotify.com/v1/search?q=isrc%3AUS7VG1846811&type=track";

  constructor(
    private readonly httpClient: HttpClient,
  ) { }

  ready(): Observable<any[]> {
    const headers = new HttpHeaders({
      "Authorization": "Bearer BQBLHVvGfmv_GNbdGJ8Oydo0ma-bCfd_PwgE_98LBV9rS_I2Np8d22QODQiI6J4m43VYP-pDKx1MlDoF22asqIDESn5kRnAcHB-Kp7zdJ7BKFuCD7crO8IRS76b6cXWfPY2wZbQ05SmkV3Hu4RjEe5HlfAS4fHzAsKL8BnVuIARFBv6CuDZmKCzWJ4ipag",
    });

    return this.httpClient.get<any[]>(this.URL_API, { headers });
  }
}
