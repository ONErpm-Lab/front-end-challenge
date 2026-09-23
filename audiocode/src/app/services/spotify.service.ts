import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { TrackData } from '../models/track.model';
import { environment } from '../environments/environments';

interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface SpotifyTrackResponse {
  tracks: {
    items: SpotifyTrack[];
  };
}

interface SpotifyTrack {
  id: string;
  name: string;
  album: {
    images: { url: string }[];
    release_date: string;
  };
  artists: { name: string }[];
  duration_ms: number;
  preview_url: string | null;
  external_urls: {
    spotify: string;
  };
  external_ids: {
    isrc?: string;
  };
  available_markets: string[];
}

@Injectable({
  providedIn: 'root'
})
export class SpotifyService {
  private readonly tokenUrl = 'https://accounts.spotify.com/api/token';
  private readonly apiUrl = 'https://api.spotify.com/v1';
  
  private accessToken: string | null = null;
  private tokenExpiration: number | null = null;

  constructor(private http: HttpClient) {}

  /**
   * Obtains or refreshes the access token using Client Credentials Flow
   */
  private getToken(): Observable<string> {
    // Check if we have a valid token cached
    if (this.accessToken && this.tokenExpiration && Date.now() < this.tokenExpiration) {
      return of(this.accessToken);
    }

    // Request new token
    const body = new HttpParams()
      .set('grant_type', 'client_credentials')
      .set('client_id', environment.spotify.clientId)
      .set('client_secret', environment.spotify.clientSecret);

    return this.http.post<SpotifyTokenResponse>(this.tokenUrl, body.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }).pipe(
      map(response => {
        this.accessToken = response.access_token;
        this.tokenExpiration = Date.now() + (response.expires_in - 60) * 1000; // Refresh 60s before expiry
        return this.accessToken!;
      })
    );
  }

  /**
   * Searches for a track by ISRC code
   */
  searchTrackByIsrc(isrc: string): Observable<TrackData | null> {
    return this.getToken().pipe(
      switchMap(token => {
        const params = new HttpParams()
          .set('q', `isrc:${isrc}`)
          .set('type', 'track')
          .set('market', 'BR'); // Filter for Brazil market

        return this.http.get<SpotifyTrackResponse>(`${this.apiUrl}/search`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          params
        }).pipe(
          map(response => {
            console.log('Dados recebidos do Spotify:', response);
            return response;
          })
        );
      }),
      map(response => {
        const track = response.tracks.items[0];
        if (!track) {
          return null;
        }
        return this.mapToTrackData(track);
      }),
      catchError(error => {
        console.error(`Error fetching track ${isrc}:`, error);
        return of(null);
      })
    );
  }

  /**
   * Searches for multiple tracks by ISRC codes
   */
  searchTracksByIsrcs(isrcs: string[]): Observable<(TrackData | null)[]> {
    const requests = isrcs.map(isrc => this.searchTrackByIsrc(isrc));
    return forkJoin(requests);
  }

  /**
   * Maps Spotify API response to TrackData interface
   */
  private mapToTrackData(track: SpotifyTrack): TrackData {
    const durationMinutes = Math.floor(track.duration_ms / 60000);
    const durationSeconds = Math.floor((track.duration_ms % 60000) / 1000);
    const durationFormated = `${durationMinutes.toString().padStart(2, '0')}:${durationSeconds.toString().padStart(2, '0')}`;
    const availableInBR = track.available_markets?.includes('BR') ?? true;

    return {
      isrc: track.external_ids.isrc ?? '',
      albumThumb: track.album.images[0]?.url ?? '',
      releaseDate: track.album.release_date,
      title: track.name,
      artists: track.artists.map(artist => artist.name),
      durationFormated,
      previewUrl: track.preview_url,
      spotifyLink: track.external_urls.spotify,
      availableInBR
    };
  }
}