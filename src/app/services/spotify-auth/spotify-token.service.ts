import { Injectable, inject } from '@angular/core';
import { SpotifyAccountsApiService } from '../../api/spotify-accounts/spotify-accounts-api.service';
import { NOW } from '../common/time';
import { TOKEN_EXPIRY_MARGIN_MS } from './spotify-auth.constants';
import { SPOTIFY_CREDENTIALS } from './spotify-credentials';

interface CachedToken {
  readonly value: string;
  readonly expiresAt: number;
}

/**
 * The Spotify app token of this visit. Kept until shortly before it expires, and one request is shared by every
 * caller that asks at the same time (the ten ISRCs start together).
 */
@Injectable({ providedIn: 'root' })
export class SpotifyTokenService {
  private readonly _api = inject(SpotifyAccountsApiService);
  private readonly _credentials = inject(SPOTIFY_CREDENTIALS);
  private readonly _now = inject(NOW);
  private _cached: CachedToken | null = null;
  private _inflight: Promise<string> | null = null;

  public get(): Promise<string> {
    if (this._cached && this._now() < this._cached.expiresAt) {
      return Promise.resolve(this._cached.value);
    }
    this._inflight ??= this._request().finally(() => {
      this._inflight = null;
    });
    return this._inflight;
  }

  /** Forgets the token (Spotify refused it), so the next `get()` asks for a new one. */
  public invalidate(): void {
    this._cached = null;
  }

  private async _request(): Promise<string> {
    const { accessToken, expiresIn } = await this._api.requestAppToken(this._credentials);
    const lifetimeMs = Math.max(expiresIn * 1000 - TOKEN_EXPIRY_MARGIN_MS, 0);
    this._cached = { value: accessToken, expiresAt: this._now() + lifetimeMs };
    return accessToken;
  }
}
