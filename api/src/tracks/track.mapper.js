/** Converte o objeto track do Spotify no contrato que o frontend consome. */
export function toTrackDto(isrc, track, availableInBrazil) {
  const images = track.album?.images ?? [];
  return {
    isrc,
    spotifyId: track.id ?? null,
    title: track.name,
    artists: track.artists.map((artist) => artist.name),
    albumName: track.album?.name ?? '',
    albumImageUrl: images[0]?.url ?? null,
    thumbnailUrl: (images[1] ?? images[0])?.url ?? null,
    releaseDate: track.album?.release_date ?? null,
    releaseDatePrecision: track.album?.release_date_precision ?? 'day',
    durationMs: track.duration_ms,
    previewUrl: track.preview_url ?? null,
    spotifyUrl: track.external_urls?.spotify ?? null,
    availableInBrazil,
  };
}
