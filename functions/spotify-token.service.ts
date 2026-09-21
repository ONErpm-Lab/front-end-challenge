/**
 * Platform-agnostic Spotify token retrieval.
 *
 * Deliberately free of any platform binding (no `process`, no Node built-ins, no
 * Cloudflare types) so that the only thing a different host changes is the thin
 * handler that calls it. Web standards only: `fetch`, `btoa`, `Response`.
 */

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';

export interface SpotifyCredentials {
  readonly clientId: string;
  readonly clientSecret: string;
}

/** The only shape the browser is ever allowed to see. */
export interface AccessToken {
  readonly access_token: string;
  readonly expires_in: number;
  readonly token_type: string;
}

export class TokenRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'TokenRequestError';
  }
}

/**
 * Exchanges client credentials for an app-only access token.
 *
 * Throws {@link TokenRequestError} on any upstream failure. The thrown message is
 * for server-side logs only and must never be forwarded to the browser verbatim.
 */
export async function requestAccessToken({
  clientId,
  clientSecret,
}: SpotifyCredentials): Promise<AccessToken> {
  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' }),
  });

  if (!response.ok) {
    throw new TokenRequestError(
      `Spotify token endpoint responded with ${response.status}`,
      response.status,
    );
  }

  const payload = (await response.json()) as Partial<AccessToken>;

  if (!payload.access_token || typeof payload.expires_in !== 'number') {
    throw new TokenRequestError('Spotify token response was missing required fields', 502);
  }

  // Rebuilt field by field so no unexpected upstream property can leak downstream.
  return {
    access_token: payload.access_token,
    expires_in: payload.expires_in,
    token_type: payload.token_type ?? 'Bearer',
  };
}
