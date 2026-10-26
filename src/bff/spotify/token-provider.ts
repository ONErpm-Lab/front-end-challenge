import { REQUEST_TIMEOUT_MS, TOKEN_EXPIRY_MARGIN_MS, TOKEN_URL } from './spotify.constants';
import { systemClock } from '../shared/system-time';
import { Clock, FetchFn } from '../shared/shared.types';
import { SpotifyUnavailableError } from './spotify-errors';
import { SpotifyFailureReason } from './spotify.enums';
import {
  AccessTokenProvider,
  CachedToken,
  SpotifyCredentials,
  SpotifyTokenResponse,
  TokenProviderOptions,
} from './spotify.interfaces';

/**
 * Client Credentials token source. Caches the token until shortly before it expires and
 * collapses concurrent refreshes into a single request (single-flight).
 */
export class SpotifyTokenProvider implements AccessTokenProvider {
  private readonly _fetchFn: FetchFn;
  private readonly _now: Clock;
  private _cached: CachedToken | null = null;
  private _inflight: Promise<string> | null = null;

  constructor(
    private readonly _credentials: SpotifyCredentials,
    options: TokenProviderOptions = {},
  ) {
    this._fetchFn = options.fetchFn ?? fetch;
    this._now = options.now ?? systemClock;
  }

  public getToken(): Promise<string> {
    if (this._cached && this._now() < this._cached.expiresAt) {
      return Promise.resolve(this._cached.value);
    }
    this._inflight ??= this._requestToken().finally(() => {
      this._inflight = null;
    });
    return this._inflight;
  }

  public invalidate(): void {
    this._cached = null;
  }

  private async _requestToken(): Promise<string> {
    const response = await this._post();
    if (!response.ok) {
      throw new SpotifyUnavailableError(SpotifyFailureReason.TOKEN_REQUEST_FAILED, {
        status: response.status,
      });
    }

    const body = (await response.json().catch(() => null)) as Partial<SpotifyTokenResponse> | null;
    if (typeof body?.access_token !== 'string' || typeof body.expires_in !== 'number') {
      throw new SpotifyUnavailableError(SpotifyFailureReason.TOKEN_RESPONSE_MALFORMED);
    }

    const lifetimeMs = Math.max(body.expires_in * 1000 - TOKEN_EXPIRY_MARGIN_MS, 0);
    this._cached = { value: body.access_token, expiresAt: this._now() + lifetimeMs };
    return body.access_token;
  }

  private async _post(): Promise<Response> {
    const { clientId, clientSecret } = this._credentials;
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    try {
      return await this._fetchFn(TOKEN_URL, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basic}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (cause) {
      throw new SpotifyUnavailableError(SpotifyFailureReason.TOKEN_REQUEST_NETWORK_ERROR, {
        cause,
      });
    }
  }
}
