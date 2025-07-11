import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import { SpotifyAuthService } from '../spotify-auth/spotify-auth.service';
import { environment } from '../../../environments/environment';
import { Track } from '../../interfaces/track';

@Injectable({
  providedIn: 'root'
})
export class SpotifyApiService {

  constructor(private http: HttpClient, private authService: SpotifyAuthService) { }

  private requestSpotifyApi<T>(method: string, endpoint: string, options?: { headers?: HttpHeaders, params?: HttpParams, body?: any }): Observable<T> {
    return this.authService.getValidAccessToken().pipe(
      switchMap(token => {
        if (!token) {
          return throwError(() => new Error('SpotifyApiService: Access Token is not available.'));
        }
        const headers = this.createAuthorizationHeader(token, options?.headers);
        console.log(`SpotifyApiService: Fazendo requisição ${method} para ${endpoint}`);
        return this.http.request<T>(method, `${environment.apiBaseUrl}${endpoint}`, { ...options, headers });
      }),
      catchError(error => {
        console.error(`SpotifyApiService: Erro na requisição ${method} para ${endpoint}:`, error);
        return throwError(() => new Error(`Spotify API request failed for ${endpoint}: ${error.message || error}`));
      })
    );
  }

  private createAuthorizationHeader(token: string, existingHeaders?: HttpHeaders): HttpHeaders {
    let headers = existingHeaders || new HttpHeaders();
    return headers.set('Authorization', `Bearer ${token}`);
  }

  private formatTrackData(track: any): Track {
    const durationMs = track.duration_ms;
    const minutes = Math.floor(durationMs / 60000);
    const seconds = ((durationMs % 60000) / 1000).toFixed(0);
    const formattedDuration = minutes + ':' + (parseInt(seconds) < 10 ? '0' : '') + seconds;
    const availableInBrazil = track.available_markets.includes('BR');

    return {
      albumThumb: track.album.images[0].url,
      releaseDate: track.album.release_date,
      trackTitle: track.name,
      artists: track.artists.map((artist: any) => artist.name).join(', '),
      duration: formattedDuration,
      audioPreviewUrl: track.preview_url,
      spotifyPageLink: track.external_urls.spotify,
      availableInBrazil: availableInBrazil
    };
  }

  searchTracksByIsrc(query: string, limit: number = 20): Observable<Track[]> {
    const params = new HttpParams()
      .set('q', query)
      .set('type', 'track')
      .set('limit', limit.toString());

    return this.requestSpotifyApi('GET', '/search', { params }).pipe(
      map((response: any) => {
        if (response.tracks && response.tracks.items.length > 0) {
          return response.tracks.items.map((item: any) => this.formatTrackData(item));
        }

        return null;
      })
    );
  }
}