import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { from, Observable, of, timer } from "rxjs";
import {
  bufferCount,
  catchError,
  concatMap,
  map,
  switchMap,
} from "rxjs/operators";

@Injectable({
  providedIn: "root",
})
export class SpotfyService {
  private apiUrl = "https://api.spotify.com/v1";
  private requestDelay = 100; // 100ms delay between calls to avoid call boundary errors

  constructor(private http: HttpClient) {}

  // Busca múltiplas faixas por ISRCs com delay
  getTracksByIsrcs(isrcs: string[]): Observable<any[]> {
    return from(isrcs).pipe(
      concatMap((isrc) => this.getTrackByIsrcWithDelay(isrc)),
      bufferCount(isrcs.length),
      map((tracks) => tracks.filter((track) => track !== null))
    );
  }

  // Busca uma faixa com delay para evitar rate limiting
  private getTrackByIsrcWithDelay(isrc: string): Observable<any> {
    return timer(this.requestDelay).pipe(
      switchMap(() => this.getTrackByIsrc(isrc))
    );
  }

  // Busca uma única faixa por ISRC
  getTrackByIsrc(isrc: string): Observable<any> {
    return this.searchTrackByIsrc(isrc).pipe(
      switchMap((trackId) => (trackId ? this.getTrackById(trackId) : of(null))),
      catchError((error) => {
        console.error(`Erro na busca do ISRC ${isrc}:`, error);
        return of(null);
      })
    );
  }

  // Busca uma faixa por ID
  private getTrackById(trackId: string): Observable<any> {
    const url = `${this.apiUrl}/tracks/${trackId}?market=BR`;
    return this.http.get<any>(url).pipe(
      catchError((error) => {
        console.error(`Erro na busca da faixa ${trackId}:`, error);
        return of(null);
      })
    );
  }

  // Busca o ID da track pelo ISRC
  private searchTrackByIsrc(isrc: string): Observable<string | null> {
    const url = `${this.apiUrl}/search?q=isrc:${isrc}&type=track&market=BR`;
    return this.http
      .get<any>(url)
      .pipe(
        map((response) => this.extractTrackIdFromSearchResponse(response, isrc))
      );
  }

  // Extrai e valida o ID da track da resposta da busca
  private extractTrackIdFromSearchResponse(
    response: any,
    isrc: string
  ): string | null {
    const items = response.tracks?.items || [];

    if (!items.length) {
      console.warn(`Nenhuma faixa encontrada para o ISRC ${isrc}`);
      return null;
    }

    const trackId = items[0].id;

    if (!trackId) {
      console.error(`ID de faixa não encontrado para o ISRC ${isrc}`);
      return null;
    }

    return trackId;
  }
}
