/** Falha ao falar com o Spotify (credenciais, rede ou indisponibilidade). */
export class SpotifyUnavailableError extends Error {
  constructor(message, cause) {
    super(message, { cause });
    this.name = 'SpotifyUnavailableError';
  }
}
