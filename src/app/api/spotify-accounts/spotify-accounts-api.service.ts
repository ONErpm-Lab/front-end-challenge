import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom, timeout } from 'rxjs';
import { SpotifyAuthError } from './spotify-auth-error';
import { SPOTIFY_TOKEN_URL, TOKEN_REQUEST_TIMEOUT_MS } from './spotify-accounts.constants';
import {
  SpotifyAppToken,
  SpotifyCredentials,
  SpotifyTokenResponse,
} from './spotify-accounts.interfaces';

/** Client of Spotify's accounts service: trades the app credentials for an app token. */
@Injectable({ providedIn: 'root' })
export class SpotifyAccountsApiService {
  private readonly _http = inject(HttpClient);

  public async requestAppToken(credentials: SpotifyCredentials): Promise<SpotifyAppToken> {
    if (!credentials.clientId || !credentials.clientSecret) {
      throw new SpotifyAuthError('Spotify credentials are not configured');
    }
    const headers = new HttpHeaders({
      Authorization: `Basic ${btoa(`${credentials.clientId}:${credentials.clientSecret}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    });

    let body: Partial<SpotifyTokenResponse> | null;
    try {
      body = await firstValueFrom(
        this._http
          .post<Partial<SpotifyTokenResponse> | null>(
            SPOTIFY_TOKEN_URL,
            'grant_type=client_credentials',
            { headers },
          )
          .pipe(timeout(TOKEN_REQUEST_TIMEOUT_MS)),
      );
    } catch (cause) {
      throw new SpotifyAuthError('Spotify token request failed', { cause });
    }
    if (typeof body?.access_token !== 'string' || typeof body.expires_in !== 'number') {
      throw new SpotifyAuthError('Spotify answered the token request with an unexpected body');
    }
    return { accessToken: body.access_token, expiresIn: body.expires_in };
  }
}
