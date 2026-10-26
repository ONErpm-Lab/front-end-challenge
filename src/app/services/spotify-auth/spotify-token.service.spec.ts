import { TestBed } from '@angular/core/testing';
import { SpotifyAccountsApiService } from '../../api/spotify-accounts/spotify-accounts-api.service';
import { SpotifyAuthError } from '../../api/spotify-accounts/spotify-auth-error';
import { NOW } from '../common/time';
import { SPOTIFY_CREDENTIALS } from './spotify-credentials';
import { SpotifyTokenService } from './spotify-token.service';

const CREDENTIALS = { clientId: 'id', clientSecret: 'secret' };

function setup() {
  let now = 0;
  let issued = 0;
  const requestAppToken = vi.fn<SpotifyAccountsApiService['requestAppToken']>(async () => ({
    accessToken: `token-${++issued}`,
    expiresIn: 3600,
  }));
  TestBed.configureTestingModule({
    providers: [
      { provide: SpotifyAccountsApiService, useValue: { requestAppToken } },
      { provide: SPOTIFY_CREDENTIALS, useValue: CREDENTIALS },
      { provide: NOW, useValue: () => now },
    ],
  });
  return {
    token: TestBed.inject(SpotifyTokenService),
    requestAppToken,
    advance: (ms: number) => (now += ms),
  };
}

describe('SpotifyTokenService', () => {
  it('asks for a token with the credentials of the environment, and reuses it while valid', async () => {
    const { token, requestAppToken, advance } = setup();

    expect(await token.get()).toBe('token-1');
    advance(30 * 60_000);
    expect(await token.get()).toBe('token-1');
    expect(requestAppToken).toHaveBeenCalledExactlyOnceWith(CREDENTIALS);
  });

  it('renews it a minute before it expires', async () => {
    const { token, advance } = setup();
    await token.get();

    advance(59 * 60_000);

    expect(await token.get()).toBe('token-2');
  });

  it('shares one request among callers that ask at the same time', async () => {
    const { token, requestAppToken } = setup();

    const tokens = await Promise.all([token.get(), token.get(), token.get()]);

    expect(tokens).toEqual(['token-1', 'token-1', 'token-1']);
    expect(requestAppToken).toHaveBeenCalledTimes(1);
  });

  it('asks for a new one after it was refused', async () => {
    const { token } = setup();
    await token.get();

    token.invalidate();

    expect(await token.get()).toBe('token-2');
  });

  it('fails when no token can be had, and asks again next time', async () => {
    const { token, requestAppToken } = setup();
    requestAppToken.mockRejectedValueOnce(new SpotifyAuthError('refused'));

    await expect(token.get()).rejects.toBeInstanceOf(SpotifyAuthError);
    expect(await token.get()).toBe('token-1');
  });
});
