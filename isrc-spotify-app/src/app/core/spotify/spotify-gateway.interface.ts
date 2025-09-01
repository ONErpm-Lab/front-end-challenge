import { Observable } from 'rxjs';
import { ITrack, ISpotifySearchResponse } from '../../modules/tracks/models';

export interface ISpotifyGateway {
  /**
   * Busca track por ISRC
   * @param isrc - Código ISRC da track
   * @returns Observable com a track encontrada ou null
   */
  searchTrackByISRCObservable(isrc: string): Observable<ITrack | null>;

  /**
   * Busca múltiplas tracks por ISRCs
   * @param isrcs - Array de códigos ISRC
   * @returns Observable com array de tracks encontradas
   */
  searchTracksByISRCsObservable(isrcs: Array<string>): Observable<Array<ITrack>>;
}
