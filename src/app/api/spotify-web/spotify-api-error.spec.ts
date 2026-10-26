import { SpotifyApiError } from './spotify-api-error';
import { SpotifyApiFailure } from './spotify-web.enums';

describe('SpotifyApiError', () => {
  it('says what failed, with the status when there is one', () => {
    const error = new SpotifyApiError(SpotifyApiFailure.HTTP, 429, 3000);

    expect(error.name).toBe('SpotifyApiError');
    expect(error.message).toBe('Spotify Web API call failed: http (HTTP 429)');
    expect(error).toMatchObject({ failure: 'http', status: 429, retryAfterMs: 3000 });
  });

  it('has no status for a network failure', () => {
    expect(new SpotifyApiError(SpotifyApiFailure.NETWORK).message).toBe(
      'Spotify Web API call failed: network',
    );
  });
});
