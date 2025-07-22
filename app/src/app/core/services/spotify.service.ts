import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { Track } from '../../tracks/track.model';
import { environment } from '../../../environments/environment';

/**
 * Serviço responsável por autenticar e buscar dados da API pública do Spotify.
 * Utiliza o Client Credentials Flow (sem usuário logado).
 */
@Injectable({
  providedIn: 'root',
})
export class SpotifyService {
  // Injeção de dependência moderna
  private readonly http = inject(HttpClient);

  // Configurações obtidas do environment
  private readonly clientId = environment.spotify.clientId;
  private readonly clientSecret = environment.spotify.clientSecret;

  private readonly tokenUrl = 'https://accounts.spotify.com/api/token';
  private readonly apiUrl = 'https://api.spotify.com/v1';

  // Token de acesso temporário da sessão
  private accessToken: string | null = null;

  /**
   * Autentica na API do Spotify (Client Credentials Flow)
   * @returns Observable com token de acesso
   */
  private authenticate() {
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoa(`${this.clientId}:${this.clientSecret}`)}`,
    });

    const body = new HttpParams().set('grant_type', 'client_credentials');

    return this.http
      .post<{ access_token: string }>(this.tokenUrl, body.toString(), { headers })
      .pipe(map((res) => res.access_token));
  }

  /**
   * Busca múltiplas faixas por uma lista de códigos ISRC.
   * @param isrcList Lista de códigos ISRC (identificadores únicos de faixas)
   * @returns Observable com array de faixas válidas ou marcadas como not found
   */
  public fetchTracksByISRCList(isrcList: string[]) {
    return this.authenticate().pipe(
      switchMap((token) => {
        this.accessToken = token;

        const requests = isrcList.map((isrc) =>
          this.fetchTrackByISRC(isrc).pipe(
            map((track) => track ?? this.buildNotFoundTrack(isrc))
          )
        );

        return forkJoin(requests);
      }),
      catchError((error) => {
        console.error('Erro na autenticação ou nas requisições:', error);
        return of([]); // Retorna array vazio em caso de erro total
      })
    );
  }

  /**
   * Busca uma única faixa usando um código ISRC
   * @param isrc Código ISRC da faixa
   * @returns Observable com objeto Track ou marcação como não encontrado
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
          const item = res?.tracks?.items?.[0];
          if (!item) return this.buildNotFoundTrack(isrc);

          return <Track>{
            title: item.name,
            artists: item.artists.map((a: any) => a.name),
            albumImage: item.album.images?.[Math.floor(item.album.images.length / 2)]?.url ?? '',
            releaseDate: item.album.release_date,
            durationMs: item.duration_ms,
            previewUrl: item.preview_url,
            externalUrl: item.external_urls.spotify,
            availableInBrazil: item.available_markets?.includes('BR') ?? false,
            notFound: false,
          };
        }),
        catchError((err) => {
          console.warn(`Erro ao buscar ISRC ${isrc}:`, err);
          return of(this.buildNotFoundTrack(isrc));
        })
      );
  }

  /**
   * Constrói um objeto Track para ISRCs não encontrados.
   * @param isrc Código ISRC consultado
   * @returns Objeto Track com notFound = true
   */
  private buildNotFoundTrack(isrc: string): Track {
    return {
      title: `ISRC não encontrado: ${isrc}`,
      artists: [],
      albumImage: '',
      releaseDate: '',
      durationMs: 0,
      previewUrl: null,
      externalUrl: '',
      availableInBrazil: false,
      notFound: true,
    };
  }
}
