import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import { ITrack } from '../models';
import { sortByTitlePTBR } from '../../../core';
import { environment } from '../../../../environments/environment';
import { SpotifyAuthService } from '../../../core/spotify/spotify-auth.service';
import { ISRCCodes, ISpotifyTrack } from '../../../core/models';
import { BaseExtractService } from '../../../core/services/base-extract.service';

@Injectable({
  providedIn: 'root',
})
export class TracksService extends BaseExtractService<Array<ITrack>> {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(SpotifyAuthService);

  constructor() {
    super();
  }

  /**
   * Implementação do método abstrato
   */
  protected getInitialData(): Array<ITrack> {
    return [];
  }

  /**
   * Carrega todas as tracks por ISRC
   */
  loadAllTracks(): Observable<Array<ITrack>> {
    this.setLoading(true);

    // Primeiro gera o token, depois busca as tracks
    return this.authService.getToken().pipe(
      switchMap(() => {
        // Busca todas as tracks em paralelo
        const tracks$ = Object.values(ISRCCodes).map((isrc) => this.searchTrackByISRC(isrc));

        return forkJoin(tracks$).pipe(
          map((tracks) => tracks.filter((track) => track !== null) as ITrack[]),
          map((tracks) => sortByTitlePTBR(tracks)),
          tap((tracks) => this.setData(tracks)),
          catchError((error) => {
            const errorMessage = error.message || 'Erro ao carregar tracks. Verifique sua conexão.';
            this.setError(errorMessage);
            return of([]);
          })
        );
      })
    );
  }

  /**
   * Busca track específica por ISRC
   */
  searchTrackByISRC(isrc: string): Observable<ITrack | null> {
    const url = `${environment.SPOTIFY_API_URL}/search`;
    const params = {
      q: `isrc:${isrc}`,
      type: 'track',
      include_external: 'audio',
    };

    // Primeiro gera o token, depois faz a busca
    return this.authService.getToken().pipe(
      switchMap(() => {
        return this.http.get<any>(url, { params }).pipe(
          map((response) => {
            if (response.tracks?.items?.length > 0) {
              return this.mapSpotifyTrackToTrack(response.tracks.items[0], isrc);
            }
            return null;
          }),
          catchError(() => of(null))
        );
      })
    );
  }

  /**
   * Mapeia a resposta do Spotify para nosso modelo
   */
  private mapSpotifyTrackToTrack(spotifyTrack: ISpotifyTrack, isrc: string): ITrack {
    console.log('🔍 Mapeando track:', spotifyTrack.name, 'ISRC:', isrc);
    console.log('🔍 Preview URL:', spotifyTrack.preview_url);

    const track = {
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

    console.log('🔍 Track mapeada:', track);
    return track;
  }

  /**
   * Recarrega as tracks (útil para botão "Tentar novamente")
   */
  reloadTracks(): Observable<Array<ITrack>> {
    return this.loadAllTracks();
  }

  /**
   * Filtra tracks por disponibilidade no Brasil
   */
  getTracksByAvailability(availableInBR: boolean): Observable<Array<ITrack>> {
    return this.data$.pipe(
      map((tracks) =>
        tracks.filter((track) =>
          availableInBR
            ? track.available_markets.includes('BR')
            : !track.available_markets.includes('BR')
        )
      )
    );
  }

  /**
   * Filtra tracks por artista
   */
  getTracksByArtist(artistName: string): Observable<Array<ITrack>> {
    return this.data$.pipe(
      map((tracks) =>
        tracks.filter((track) =>
          track.artists.some((artist) =>
            artist.name.toLowerCase().includes(artistName.toLowerCase())
          )
        )
      )
    );
  }

  /**
   * Busca tracks por termo de busca (ISRC, nome, artista, álbum)
   */
  searchTracksByTerm(searchTerm: string): Observable<Array<ITrack>> {
    if (!searchTerm.trim()) {
      return this.data$;
    }

    const term = searchTerm.trim().toLowerCase();

    // Se parece ser um ISRC (formato específico), busca na API
    if (this.isISRCFormat(term)) {
      return this.searchTrackByISRC(term).pipe(map((track) => (track ? [track] : [])));
    }

    // Caso contrário, filtra localmente
    return this.data$.pipe(
      map((tracks) =>
        tracks.filter(
          (track) =>
            track.isrc.toLowerCase().includes(term) ||
            track.name.toLowerCase().includes(term) ||
            track.artists.some((artist) => artist.name.toLowerCase().includes(term)) ||
            track.album.name.toLowerCase().includes(term)
        )
      )
    );
  }

  /**
   * Verifica se o termo de busca tem formato de ISRC
   */
  private isISRCFormat(term: string): boolean {
    // Formato ISRC mais flexível: 2 letras + 3 alfanuméricos + 2 alfanuméricos + 5 números
    // Mas também aceita variações comuns
    const isrcPattern = /^[A-Z]{2}[A-Z0-9]{3}[A-Z0-9]{2}[0-9]{5}$/i;
    const alternativePattern = /^[A-Z]{2}[A-Z0-9]{3}[A-Z0-9]{2}[0-9]{4,6}$/i;

    return isrcPattern.test(term) || alternativePattern.test(term);
  }
}
