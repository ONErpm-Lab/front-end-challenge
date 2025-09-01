import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, tap, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ISpotifyTokenResponse } from '../models';

@Injectable({
  providedIn: 'root',
})
export class SpotifyAuthService {
  private readonly http = inject(HttpClient);

  private readonly tokenSubject = new BehaviorSubject<string | null>(null);
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  private readonly errorSubject = new BehaviorSubject<string | null>(null);

  readonly token$ = this.tokenSubject.asObservable();
  readonly loading$ = this.loadingSubject.asObservable();
  readonly error$ = this.errorSubject.asObservable();

  /**
   * Gera um novo token de acesso
   */
  generateToken(): Observable<string> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    const body = new URLSearchParams();
    body.set('grant_type', 'client_credentials');

    const headers = new HttpHeaders()
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .set(
        'Authorization',
        `Basic ${btoa(`${environment.SPOTIFY_CLIENT_ID}:${environment.SPOTIFY_CLIENT_SECRET}`)}`
      );

    return this.http
      .post<ISpotifyTokenResponse>(environment.SPOTIFY_TOKEN_URL, body.toString(), {
        headers,
      })
      .pipe(
        tap((response) => {
          sessionStorage.setItem('spotifyToken', response.access_token);

          this.tokenSubject.next(response.access_token);
          this.loadingSubject.next(false);

          // Configura um timer para renovar o token antes de expirar
          setTimeout(() => {
            this.generateToken();
          }, (response.expires_in - 60) * 1000); // Renova 1 minuto antes de expirar
        }),
        catchError((error) => {
          this.loadingSubject.next(false);
          const errorMessage = 'Erro ao gerar token do Spotify. Verifique suas credenciais.';
          this.errorSubject.next(errorMessage);
          return throwError(() => new Error(errorMessage));
        }),
        switchMap((response) => of(response.access_token))
      );
  }

  /**
   * Obtém o token atual ou gera um novo se necessário
   */
  getToken(): Observable<string> {
    const currentToken = this.tokenSubject.value;

    if (currentToken) {
      return of(currentToken);
    }

    return this.generateToken();
  }

  /**
   * Limpa o token atual
   */
  clearToken(): void {
    this.tokenSubject.next(null);
  }

  /**
   * Limpa o erro
   */
  clearError(): void {
    this.errorSubject.next(null);
  }

  /**
   * Verifica se há um token válido
   */
  hasValidToken(): boolean {
    return !!this.tokenSubject.value;
  }

  /**
   * Obtém o token atual em cache (sem fazer nova requisição)
   */
  getCurrentToken(): string | null {
    return this.tokenSubject.value;
  }
}
