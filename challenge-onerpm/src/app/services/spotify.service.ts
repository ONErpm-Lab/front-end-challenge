import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class SpotifyService {
  private clientId = '65d1f89916204b5880ace3d6154dbb89';
  private clientSecret = '2364f691bd694202851f4a1e467a66b9';
  private tokenUrl = 'https://accounts.spotify.com/api/token';
  private searchUrl = 'https://api.spotify.com/v1/search';

  private token: string | undefined;

  constructor(private http: HttpClient) { }

  authenticate(): Observable<string> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + btoa(this.clientId + ':' + this.clientSecret),
    });  

    const body = 'grant_type=client_credentials';

    return this.http.post<{ access_token: string }>(this.tokenUrl, body, { headers }).pipe(
      map((response) => {
        this.token = response.access_token;
        console.log('Token obtido: ', this.token)
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

    const params = {
      q: `isrc: ${isrc}`,
      type: 'track',
    };

    return this.http.get(this.searchUrl, { headers, params}).pipe(map((response) => {
      console.log('Resposta da busca do ISRC: ', response);
      return response;
    }));
  }
}



