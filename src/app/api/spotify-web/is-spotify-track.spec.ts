import { spotifyTrack } from './testing/builders';
import { CHALLENGE_ISRCS } from './testing/fixtures';
import { recordedTracks } from './testing/fixtures';
import { isSpotifyTrack } from './is-spotify-track';

const REMOVE = Symbol('remove');

/** Clones a valid track and overwrites (or removes) the value at a dotted path, e.g. `album.images.0.url`. */
function withValueAt(path: string, value: unknown): unknown {
  const track: unknown = structuredClone(spotifyTrack());
  const keys = path.split('.');
  const last = keys.pop() as string;
  const parent = keys.reduce<Record<string, unknown>>(
    (node, key) => node[key] as Record<string, unknown>,
    track as Record<string, unknown>,
  );
  if (value === REMOVE) {
    delete parent[last];
  } else {
    parent[last] = value;
  }
  return track;
}

describe('isSpotifyTrack', () => {
  it('accepts a complete track', () => {
    expect(isSpotifyTrack(spotifyTrack())).toBe(true);
  });

  it.each(CHALLENGE_ISRCS)('accepts every recorded Spotify track of %s', (isrc) => {
    expect(recordedTracks(isrc).every(isSpotifyTrack)).toBe(true);
  });

  it('accepts a track without is_playable (no market in the request)', () => {
    expect(isSpotifyTrack(withValueAt('is_playable', REMOVE))).toBe(true);
  });

  it('accepts images without a known width', () => {
    expect(isSpotifyTrack(withValueAt('album.images.0.width', null))).toBe(true);
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['a string', 'track'],
    ['an array', []],
  ])('rejects %s', (_label, value) => {
    expect(isSpotifyTrack(value)).toBe(false);
  });

  it.each([
    ['a missing id', 'id', REMOVE],
    ['a non-string name', 'name', 42],
    ['missing artists', 'artists', REMOVE],
    ['an artist without name', 'artists', [{ id: '1' }]],
    ['a null artist', 'artists', [null]],
    ['a missing album', 'album', REMOVE],
    ['a missing album name', 'album.name', REMOVE],
    ['missing album images', 'album.images', REMOVE],
    ['an image without url', 'album.images', [{ width: 1 }]],
    ['an image with undefined width', 'album.images.0.width', REMOVE],
    ['a missing release_date', 'album.release_date', REMOVE],
    ['a missing release_date_precision', 'album.release_date_precision', REMOVE],
    ['an unknown release_date_precision', 'album.release_date_precision', 'decade'],
    ['a missing duration_ms', 'duration_ms', REMOVE],
    ['a numeric string duration_ms', 'duration_ms', '215491'],
    ['a null duration_ms', 'duration_ms', null],
    ['missing external_urls', 'external_urls', REMOVE],
    ['external_urls without spotify', 'external_urls', {}],
    ['a non-boolean is_playable', 'is_playable', 'yes'],
  ])('rejects a track with %s', (_label, path, value) => {
    expect(isSpotifyTrack(withValueAt(path, value))).toBe(false);
  });
});
