import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable, of } from "rxjs";
import { catchError, map, shareReplay, switchMap } from "rxjs/operators";
import { FormattedTrack, SpotifySearchResponse, SpotifyTokenResponse, SpotifyTrackItem } from "../models/spotify.model";
import { environment } from "../../../environments/environments";


@Injectable({
 providedIn: "root"
})
export class SpotifyService {
  private http = inject(HttpClient);
  private clientId = environment.spotify.clientId;
  private clientSecret = environment.spotify.clientSecret;
  private tokenUrl = environment.spotify.tokenUrl;
  private searchUrl = environment.spotify.searchUrl;

  private token$: Observable<string> | null = null;
  private tokenData = { token: '', expires: 0 };

  private getAccessToken(): Observable<string> {
    
    const now = Date.now();

    if (this.tokenData.token && this.tokenData.expires > now + 60000) {
      return of(this.tokenData.token);
    }

    if (this.token$) return this.token$;

    const headers = new HttpHeaders({
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + btoa(`${this.clientId}:${this.clientSecret}`)
    });

    this.token$ = this.http.post<SpotifyTokenResponse>(this.tokenUrl, "grant_type=client_credentials", { headers }).pipe(
      map(res => {
        this.tokenData.token = res.access_token;
        this.tokenData.expires = now + res.expires_in * 1000;
        return res.access_token;
      }),
      shareReplay(1)
    );

    return this.token$;
  }

  searchTrackByIsrc(isrc: string): Observable<FormattedTrack | null> {
    return this.getAccessToken().pipe(
      switchMap(token => {
        const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
        const params = { q: `isrc:${isrc}`, type: "track", limit: "1" };
        return this.http.get<SpotifySearchResponse>(this.searchUrl, { headers, params }).pipe(
          map(res => this.format(res.tracks.items[0], isrc)),
          catchError(() => of(null))
        );
      })
    );
  }

  private format(track: SpotifyTrackItem, isrc: string): FormattedTrack {
    const minutes = Math.floor(track.duration_ms / 60000);
    const seconds = String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, "0");
    return {
      id: track.id,
      isrc,
      title: track.name,
      artists: track.artists.map(a => a.name).join(", "),
      albumThumb: track.album.images[0]?.url ?? '',
      releaseDate: track.album.release_date,
      duration: `${minutes}:${seconds}`,
      spotifyUrl: track.external_urls.spotify ?? null,
      availableInBrazil: track.available_markets.includes("BR")
    };
  }

}