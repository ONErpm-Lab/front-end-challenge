// @vitest-environment node
import { readSpotifyCredentials } from './config';

describe('readSpotifyCredentials', () => {
  it('returns the trimmed credentials when both variables are set', () => {
    const env = { SPOTIFY_CLIENT_ID: ' id ', SPOTIFY_CLIENT_SECRET: ' secret\n' };

    expect(readSpotifyCredentials(env)).toEqual({ clientId: 'id', clientSecret: 'secret' });
  });

  it.each([
    ['both missing', {}],
    ['secret missing', { SPOTIFY_CLIENT_ID: 'id' }],
    ['id missing', { SPOTIFY_CLIENT_SECRET: 'secret' }],
    ['blank values', { SPOTIFY_CLIENT_ID: '  ', SPOTIFY_CLIENT_SECRET: '' }],
  ])('returns null when %s', (_label, env) => {
    expect(readSpotifyCredentials(env)).toBeNull();
  });
});
