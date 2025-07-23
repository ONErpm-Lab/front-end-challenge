import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment.dev';
import { BehaviorSubject, Observable, forkJoin, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { ISRC } from '../../core/enums/isrc.enum';
import { Track, SpotifyResponse } from '../model/track.interface';

@Injectable({
  providedIn: 'root',
})
export class SpotifyService {
  private readonly baseUrl = environment.searchUrl;

  private tracksSubject = new BehaviorSubject<Track[]>([]);
  tracks$ = this.tracksSubject.asObservable();

  private currentTrackSubject = new BehaviorSubject<Track | null>(null);
  currentTrack$ = this.currentTrackSubject.asObservable();

  constructor(private http: HttpClient) {}

  getAllTracks(): Observable<Track[]> {
    const isrcValues = Object.values(ISRC);
    const requests = isrcValues.map((isrc) => this.getTrackByIsrc(isrc));

    return forkJoin(requests).pipe(
      map((tracks) =>
        tracks
          .filter((track): track is Track => track !== null)
          .sort((a, b) => a.name.localeCompare(b.name))
      ),
      tap((tracks) => this.tracksSubject.next(tracks))
    );
  }

  getTrackByIsrc(isrc: string): Observable<Track | null> {
    const params = new URLSearchParams({
      q: `isrc:${isrc}`,
      type: 'track',
    });

    return this.http.get<SpotifyResponse>(`${this.baseUrl}?${params}`).pipe(
      map((response) => response.tracks.items[0] || null),
      catchError((error) => {
        console.error(`Erro ao buscar faixa com ISRC ${isrc}:`, error);
        return of(null);
      })
    );
  }

  addTrack(newTrack: Track) {
    const currentTracks = this.tracksSubject.getValue();

    if (!currentTracks.some((track) => track.id === newTrack.id)) {
      this.tracksSubject.next([...currentTracks, newTrack]);
    }
  }

  setCurrentTrack(track: Track) {
    this.currentTrackSubject.next(track);
  }

  isAvailableInBrazil(track: Track): boolean {
    return track.available_markets.includes('BR');
  }
}
