import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ISpotifyGateway } from './spotify-gateway.interface';
import { ITrack, ISpotifySearchResponse, ISpotifyTrack } from '../../modules/tracks/models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class HttpSpotifyGatewayService implements ISpotifyGateway {
  private readonly http = inject(HttpClient);

  searchTrackByISRCObservable(isrc: string): Observable<ITrack | null> {
    const url = `${environment.SPOTIFY_API_URL}/search`;
    const params = {
      q: `isrc:${isrc}`,
      type: 'track',
      market: environment.MARKET,
      limit: '1',
    };

    return this.http.get<ISpotifySearchResponse>(url, { params }).pipe(
      map((response) => {
        if (response.tracks.items.length > 0) {
          return this.mapSpotifyTrackToTrack(response.tracks.items[0], isrc);
        }
        return null;
      }),
      catchError(() => of(null))
    );
  }

  searchTracksByISRCsObservable(isrcs: Array<string>): Observable<Array<ITrack>> {
    // Usa forkJoin para buscar tracks em paralelo
    const tracks$ = isrcs.map((isrc) =>
      this.searchTrackByISRCObservable(isrc).pipe(catchError(() => of(null)))
    );

    return forkJoin(tracks$).pipe(
      map((tracks) => tracks.filter((track): track is ITrack => track !== null))
    );
  }

  private mapSpotifyTrackToTrack(spotifyTrack: ISpotifyTrack, isrc: string): ITrack {
    return {
      id: spotifyTrack.id,
      name: spotifyTrack.name,
      artists: spotifyTrack.artists.map((artist) => ({
        id: artist.id,
        name: artist.name,
        external_urls: artist.external_urls,
      })),
      album: {
        id: spotifyTrack.album.id,
        name: spotifyTrack.album.name,
        images: spotifyTrack.album.images,
        release_date: spotifyTrack.album.release_date,
        release_date_precision: spotifyTrack.album.release_date_precision,
        external_urls: spotifyTrack.album.external_urls,
      },
      duration_ms: spotifyTrack.duration_ms,
      preview_url: spotifyTrack.preview_url,
      external_urls: spotifyTrack.external_urls,
      available_markets: spotifyTrack.available_markets,
      isrc: isrc,
    };
  }
}
