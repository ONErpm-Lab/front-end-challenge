import { RELEASE_DATE_PRECISIONS } from './spotify.constants';
import { SpotifyTrack } from './spotify.interfaces';

/**
 * Runtime check for the fields the finder and the mapper read. Spotify's payload is external
 * input: anything missing must be rejected here instead of blowing up (or silently producing
 * an incomplete track) further down.
 */
export function isSpotifyTrack(value: unknown): value is SpotifyTrack {
  return (
    isRecord(value) &&
    typeof value['id'] === 'string' &&
    typeof value['name'] === 'string' &&
    isListOf(value['artists'], isArtist) &&
    isAlbum(value['album']) &&
    typeof value['duration_ms'] === 'number' &&
    Number.isFinite(value['duration_ms']) &&
    isRecord(value['external_urls']) &&
    typeof value['external_urls']['spotify'] === 'string' &&
    (value['is_playable'] === undefined || typeof value['is_playable'] === 'boolean')
  );
}

function isArtist(value: unknown): boolean {
  return isRecord(value) && typeof value['name'] === 'string';
}

function isAlbum(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value['name'] === 'string' &&
    isListOf(value['images'], isImage) &&
    typeof value['release_date'] === 'string' &&
    RELEASE_DATE_PRECISIONS.includes(value['release_date_precision'])
  );
}

function isImage(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value['url'] === 'string' &&
    (value['width'] === null || typeof value['width'] === 'number')
  );
}

function isListOf(value: unknown, predicate: (item: unknown) => boolean): boolean {
  return Array.isArray(value) && value.every(predicate);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
