import type { SpotifyTrackDto } from './spotify-track.dto';

/**
 * ⚠️ SYNTHETIC DATA — NOT REAL SPOTIFY RESPONSES.
 *
 * TODO(spotify-403): Spotify returns 403 on every Web API endpoint unless the app
 * owner holds an active Premium subscription, so the real payloads for these ISRCs
 * could not be fetched. Titles, artists, dates and durations below are invented
 * placeholders that merely have the right *shape*. Real titles will differ.
 * Delete this file once real access works.
 *
 * Deliberately shaped as raw Spotify DTOs rather than `Track` objects, so the
 * fixture path runs through the same mapper as production. If the mapper breaks,
 * the fixtures break too — which is the point.
 *
 * The distribution is chosen to stress the UI, not to flatter it:
 *  - most `preview_url` values are null, matching Spotify's current behaviour for
 *    apps created after Nov 2024 (the audio-player landmine);
 *  - some tracks are missing from BR;
 *  - one has a year-only release date, one has no album art, one has many artists,
 *    one has a very long title, and one ISRC resolves to nothing at all.
 */

const image = (size: number, seed: string) => ({
  url: `https://picsum.photos/seed/${seed}/${size}/${size}`,
  width: size,
  height: size,
});

const cover = (seed: string) => [image(64, seed), image(300, seed), image(640, seed)];

const dto = (
  isrc: string,
  id: string,
  name: string,
  artists: string[],
  releaseDate: string,
  durationMs: number,
  markets: string[],
  previewUrl: string | null = null,
  images: ReturnType<typeof cover> = cover(id),
): SpotifyTrackDto => ({
  id,
  name,
  duration_ms: durationMs,
  preview_url: previewUrl,
  artists: artists.map((artistName) => ({ name: artistName })),
  album: { images, release_date: releaseDate },
  external_urls: { spotify: `https://open.spotify.com/track/${id}` },
  external_ids: { isrc },
  available_markets: markets,
});

const BR_AND_FRIENDS = ['BR', 'US', 'PT', 'AR'];
const NO_BR = ['US', 'GB', 'DE'];

/** Keyed by ISRC. A code absent from this map resolves to no track, on purpose. */
export const FIXTURE_TRACKS: Readonly<Record<string, SpotifyTrackDto>> = {
  NO1R42509310: dto(
    'NO1R42509310',
    'fx01',
    'Nordlys',
    ['Kari Ødegård'],
    '2025-03-14',
    201_000,
    NO_BR,
  ),
  NO1R42511410: dto(
    'NO1R42511410',
    'fx02',
    'Vinterlys',
    ['Kari Ødegård', 'Bjørn Haugen'],
    '2025-06-02',
    247_500,
    BR_AND_FRIENDS,
    // The one track that still carries a preview, so the player's happy path exists.
    'https://cdn.example.invalid/preview/fx02.mp3',
  ),
  BRC310600002: dto(
    'BRC310600002',
    'fx03',
    'Amanhecer na Ponte',
    ['Marina Rocha'],
    '2006-11-20',
    189_000,
    BR_AND_FRIENDS,
  ),
  BR1SP1200071: dto(
    'BR1SP1200071',
    'fx04',
    'Água de Chuva',
    ['Coletivo Paulista', 'Tuca Mendes'],
    '2012',
    215_000,
    BR_AND_FRIENDS,
  ),
  BR1SP1200070: dto(
    'BR1SP1200070',
    'fx05',
    'Zumbido',
    ['Coletivo Paulista'],
    '2012-08-01',
    98_000,
    BR_AND_FRIENDS,
  ),
  BR1SP1500002: dto(
    'BR1SP1500002',
    'fx06',
    'Beco sem Saída (Ao Vivo no Auditório Municipal de São Paulo, Edição Especial)',
    ['Banda Vertigem'],
    '2015-04-17',
    412_000,
    BR_AND_FRIENDS,
  ),
  BXKZM1900338: dto(
    'BXKZM1900338',
    'fx07',
    'Ostende',
    ['Lievens', 'De Smet', 'Van Acker', 'Peeters', 'Claes'],
    '2019-09-06',
    263_000,
    NO_BR,
  ),
  BXKZM1900345: dto(
    'BXKZM1900345',
    'fx08',
    'Brugge bij Nacht',
    ['Lievens'],
    '2019-09-06',
    176_000,
    BR_AND_FRIENDS,
    null,
    // No album art at all, so the card's image fallback gets exercised.
    // Must be [] rather than undefined, which would fall back to the default.
    [],
  ),
  QZNJX2081700: dto(
    'QZNJX2081700',
    'fx09',
    'Static Bloom',
    ['Halcyon Drift'],
    '2020-10-30',
    334_000,
    BR_AND_FRIENDS,
  ),
  // QZNJX2078148 is intentionally absent: it exercises the "ISRC resolves to no
  // track" path, which the spec's 10 codes may well contain.
};
