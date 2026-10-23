const SPOTIFY_TRACK_ID = /^[A-Za-z0-9]{22}$/;

/**
 * URL do player incorporado do Spotify para uma faixa, ou `null` se o ID não tiver o formato
 * do Spotify (22 caracteres base62). A validação permite marcar a URL como confiável no iframe.
 */
export function spotifyEmbedUrl(spotifyId: string | null): string | null {
  if (!spotifyId || !SPOTIFY_TRACK_ID.test(spotifyId)) return null;
  return `https://open.spotify.com/embed/track/${spotifyId}?theme=0`;
}
