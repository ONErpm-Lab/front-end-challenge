import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { Track } from '../../tracks/track.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SpotifyService {
  // Injetando o HttpClient usando a função inject
  private http = inject(HttpClient);

  private clientId = environment.spotify.clientId;
  private clientSecret = environment.spotify.clientSecret;

  private tokenUrl = 'https://accounts.spotify.com/api/token';
  private apiUrl = 'https://api.spotify.com/v1';

  private accessToken: string | null = null;

  /**
   * Autentica na API do Spotify usando client credentials flow
   */
  private authenticate() {
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + btoa(`${this.clientId}:${this.clientSecret}`),
    });

    const body = new HttpParams().set('grant_type', 'client_credentials');

    return this.http
      .post<any>(this.tokenUrl, body.toString(), { headers })
      .pipe(map((res) => res.access_token));
  }

  /**
   * Busca uma lista de faixas a partir de uma lista de códigos ISRC
   */
  public fetchTracksByISRCList(isrcList: string[]) {
    return this.authenticate().pipe(
      switchMap((token) => {
        this.accessToken = token;
        const requests = isrcList.map((isrc) => this.fetchTrackByISRC(isrc));
        return forkJoin(requests);
      }),
      catchError((error) => {
        console.error('Erro na autenticação ou requisições:', error);
        return of([]);
      })
    );
  }

  /**
   * Busca uma faixa individual a partir de um ISRC
   */
  private fetchTrackByISRC(isrc: string) {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.accessToken}`,
    });

    const params = new HttpParams()
      .set('q', `isrc:${isrc}`)
      .set('type', 'track');

    return this.http
      .get<any>(`${this.apiUrl}/search`, { headers, params })
      .pipe(
        map((res) => {
          const item = res.tracks.items[0];
          if (!item) return null;

          const durationMs = item.duration_ms;
          const minutes = Math.floor(durationMs / 60000);
          const seconds = Math.floor((durationMs % 60000) / 1000);
          const duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;

          return {
            title: item.name,
            artists: item.artists.map((a: any) => a.name),
            albumImage: item.album.images[0]?.url,
            releaseDate: item.album.release_date,
            duration,
            previewUrl: item.preview_url,
            spotifyUrl: item.external_urls.spotify,
            availableInBrazil: item.available_markets.includes('BR'),
          } as Track;
        }),
        catchError((err) => {
          console.warn(`Erro ao buscar ISRC ${isrc}:`, err);
          return of(null);
        })
      );
  }
}
