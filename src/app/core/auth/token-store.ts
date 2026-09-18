import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, shareReplay, throwError } from 'rxjs';
import { APP_CONFIG } from '../config/app-config';
import { appError } from '../errors/app-error';
import { retryBackoff } from '../http/retry-backoff';

/** What the Pages Function returns. Deliberately the only shape we accept. */
interface AccessTokenResponse {
  readonly access_token: string;
  readonly expires_in: number;
}

/** Renew slightly early so a token can't expire mid-flight. */
const EXPIRY_SKEW_MS = 30_000;

/**
 * Owns the access token and nothing else.
 *
 * One in-flight request is shared across all callers via `shareReplay`, and the
 * result is reused until it is close to expiring — so ten simultaneous ISRC lookups
 * cost one token request, not ten.
 */
@Injectable({ providedIn: 'root' })
export class TokenStore {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);

  private cached: { token: string; expiresAt: number } | null = null;
  private inFlight: Observable<string> | null = null;

  /** A valid bearer token, fetching one only when the cached value is unusable. */
  token(): Observable<string> {
    if (this.cached && Date.now() < this.cached.expiresAt) {
      return of(this.cached.token);
    }
    return (this.inFlight ??= this.fetchToken());
  }

  /** Drops the cached token so the next call re-authenticates (used on a 401). */
  invalidate(): void {
    this.cached = null;
    this.inFlight = null;
  }

  private fetchToken(): Observable<string> {
    return this.http.post<AccessTokenResponse>(this.config.tokenEndpoint, null).pipe(
      retryBackoff(this.config.maxRetries),
      map((response) => {
        if (!response?.access_token || typeof response.expires_in !== 'number') {
          throw appError('auth', 'Não foi possível autenticar no provedor de faixas.');
        }
        this.cached = {
          token: response.access_token,
          expiresAt: Date.now() + response.expires_in * 1000 - EXPIRY_SKEW_MS,
        };
        return response.access_token;
      }),
      // Without this, a failed request would be cached as the permanent in-flight one.
      catchError((error: unknown) => {
        this.invalidate();
        return throwError(() => error);
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }
}
