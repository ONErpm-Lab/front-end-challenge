import { SpotifyUnavailableError } from './spotify-error.js';

const EXPIRY_MARGIN_MS = 60_000;

/**
 * Obtém e reaproveita o access token (fluxo Client Credentials).
 * O token só é renovado quando está perto de expirar, e pedidos simultâneos
 * compartilham a mesma requisição (sem uma chamada ao Spotify por pedido).
 */
export function createTokenService(
  { clientId, clientSecret, accountsUrl, timeoutMs = 5000 },
  fetchFn = fetch,
) {
  let cached = null;
  let inFlight = null;

  async function requestToken() {
    if (!clientId || !clientSecret) {
      throw new SpotifyUnavailableError('Credenciais do Spotify não configuradas');
    }

    let response;
    try {
      response = await fetchFn(accountsUrl, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (error) {
      throw new SpotifyUnavailableError('Não foi possível conectar ao Spotify', error);
    }

    if (!response.ok) {
      throw new SpotifyUnavailableError(`Spotify recusou a autenticação (${response.status})`);
    }

    const { access_token, expires_in } = await response.json();
    cached = { value: access_token, expiresAt: Date.now() + expires_in * 1000 - EXPIRY_MARGIN_MS };
    return cached.value;
  }

  return {
    async getToken() {
      if (cached && cached.expiresAt > Date.now()) return cached.value;
      inFlight ??= requestToken().finally(() => {
        inFlight = null;
      });
      return inFlight;
    },
  };
}
