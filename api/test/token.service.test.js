import { describe, expect, it, vi } from 'vitest';
import { SpotifyUnavailableError } from '../src/spotify/spotify-error.js';
import { createTokenService } from '../src/spotify/token.service.js';
import { jsonResponse } from './fixtures.js';

const options = { clientId: 'id', clientSecret: 'secret', accountsUrl: 'https://accounts.test/token' };

describe('TokenService', () => {
  it('reaproveita o token enquanto ele é válido', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ access_token: 'tok', expires_in: 3600 }));
    const service = createTokenService(options, fetchFn);

    expect(await service.getToken()).toBe('tok');
    expect(await service.getToken()).toBe('tok');
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('falha de forma explícita sem credenciais', async () => {
    const service = createTokenService({ ...options, clientSecret: '' }, vi.fn());

    await expect(service.getToken()).rejects.toBeInstanceOf(SpotifyUnavailableError);
  });

  it('converte erro de autenticação em SpotifyUnavailableError', async () => {
    const service = createTokenService(options, vi.fn().mockResolvedValue(jsonResponse({}, 401)));

    await expect(service.getToken()).rejects.toBeInstanceOf(SpotifyUnavailableError);
  });
});

describe('TokenService — concorrência e timeout', () => {
  it('pedidos simultâneos compartilham uma única requisição de token', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ access_token: 'tok', expires_in: 3600 }));
    const service = createTokenService(options, fetchFn);

    const tokens = await Promise.all(Array.from({ length: 10 }, () => service.getToken()));

    expect(tokens).toEqual(Array(10).fill('tok'));
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('após uma falha, o próximo pedido tenta de novo', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({}, 500))
      .mockResolvedValueOnce(jsonResponse({ access_token: 'tok', expires_in: 3600 }));
    const service = createTokenService(options, fetchFn);

    await expect(service.getToken()).rejects.toBeInstanceOf(SpotifyUnavailableError);
    expect(await service.getToken()).toBe('tok');
  });

  it('desiste quando o Spotify não responde dentro do prazo', async () => {
    const hang = (_url, { signal }) =>
      new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason)));
    const service = createTokenService({ ...options, timeoutMs: 20 }, hang);

    await expect(service.getToken()).rejects.toBeInstanceOf(SpotifyUnavailableError);
  });
});
