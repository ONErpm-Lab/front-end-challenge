import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { from, Observable, of, timer } from 'rxjs';
import { bufferCount, catchError, concatMap, map, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SpotfyService {
  private apiUrl = 'https://api.spotify.com/v1';
  private requestDelay = 100; // 100ms delay between calls to avoid call boundary errors

  constructor(private http: HttpClient) {}

  // Busca uma única faixa por ISRC
  getTrackByIsrc(isrc: string): Observable<any> {
    const url = `${this.apiUrl}/search?q=isrc:${isrc}&type=track&market=BR`;
    return this.http.get<any>(url).pipe(
      map(response => {
        const items = response.tracks?.items || [];
        if (!items.length) {
          console.warn(`Nenhuma faixa encontrada para o ISRC ${isrc}`);
          return null;
        }
        const trackId = items[0].id;
        if (!trackId || !/^[0-9a-zA-Z]{22}$/.test(trackId)) {
          console.error(`ID de faixa inválido para o ISRC ${isrc}: ${trackId}`);
          return null;
        }
        return trackId;
      }),
      switchMap(trackId => {
        if (!trackId) {
          return of(null);
        }
        return this.getTrackById(trackId);
      }),
      catchError(error => {
        console.error(`Erro na busca do ISRC ${isrc}:`, error);
        return of(null);
      })
    );
  }

  // Busca múltiplas faixas por ISRCs com delay
  getTracksByIsrcs(isrcs: string[]): Observable<any[]> {
    return from(isrcs).pipe(
      concatMap(isrc => timer(this.requestDelay).pipe(
        switchMap(() => this.getTrackByIsrc(isrc))
      )),
      map(track => ({ track, isrc: isrcs.shift() })), // Mantém o ISRC correspondente
      catchError(error => {
        console.error('Erro ao processar ISRC:', error);
        return of({ track: null, isrc: isrcs.shift() });
      }),
      map(({ track, isrc }) => {
        if (!track) {
          console.warn(`Nenhuma faixa encontrada para o ISRC ${isrc}`);
        }
        return track;
      }),
      // Coleta todos os resultados em um array
      bufferCount(isrcs.length),
      map(tracks => {
        const validTracks = tracks.filter(track => !!track);
        const missingIsrcs = isrcs.filter((_, i) => !tracks[i]);
        if (missingIsrcs.length) {
          console.warn('ISRCs sem faixas encontradas:', missingIsrcs);
        }
        return validTracks;
      })
    );
  }

  // Busca uma faixa por ID
  private getTrackById(trackId: string): Observable<any> {
    const url = `${this.apiUrl}/tracks/${trackId}?market=BR`;
    return this.http.get<any>(url).pipe(
      catchError(error => {
        console.error(`Erro na busca da faixa ${trackId}:`, error);
        return of(null);
      })
    );
  }
}