import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError, shareReplay, switchMap } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { SpotifyAuthResponse } from '../../interfaces/spotify-auth-response';

@Injectable({
  providedIn: 'root'
})
export class SpotifyAuthService {
  private accessTokenSubject = new BehaviorSubject<string | null>(null);
  public accessToken$ = this.accessTokenSubject.asObservable();

  private tokenExpirationTimer: any;

  constructor(private http: HttpClient) {
    this.getAccessToken().subscribe();
  }

  public getAccessToken(): Observable<any> {
    console.log('AuthService: Solicitando token do backend...');
    return this.http.get<SpotifyAuthResponse>(environment.backendAuthUrl).pipe(
      tap(response => {
        const token = response.access_token;
        const expiresIn = response.expires_in;

        if (token) {
          this.accessTokenSubject.next(token);
          console.log('AuthService: Token obtido com sucesso. Expira em:', expiresIn, 'segundos');
          this.scheduleTokenRefresh(expiresIn); // Agenda a renovação
        } else {
          console.error('AuthService: Resposta do backend não contém access_token:', response);
          throw new Error('Access Token not found in backend response');
        }
      }),
      catchError(error => {
        console.error('AuthService: Erro ao obter token do backend:', error);
        this.accessTokenSubject.next(null); // Limpa o token em caso de erro
        return throwError(() => new Error('Could not get Spotify access token.'));
      }),
      shareReplay(1) // Garante que a requisição seja feita uma única vez e o resultado seja compartilhado
    );
  }

  private scheduleTokenRefresh(expiresIn: number): void {
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
    }

    // Renova o token um pouco antes de expirar (ex: 5 minutos antes)
    const refreshTime = (expiresIn - 300) > 0 ? (expiresIn - 300) * 1000 : (expiresIn / 2) * 1000;
    console.log(`AuthService: Agendando renovação do token em ${refreshTime / 1000} segundos.`);

    this.tokenExpirationTimer = setTimeout(() => {
      console.log('AuthService: Renovando token...');
      this.getAccessToken().subscribe({
        next: () => console.log('AuthService: Token renovado com sucesso!'),
        error: (err) => console.error('AuthService: Erro ao renovar token automaticamente:', err)
      });
    }, refreshTime);
  }

  public getValidAccessToken(): Observable<string> {
    return this.accessToken$.pipe(
      switchMap(token => {
        if (token) {
          return new Observable<string>(observer => {
            observer.next(token);
            observer.complete();
          });
        } else {
          // Se não há token, tenta obter um novo.
          console.log('AuthService: Token não disponível, tentando obter um novo...');
          return this.getAccessToken();
        }
      })
    );
  }
}