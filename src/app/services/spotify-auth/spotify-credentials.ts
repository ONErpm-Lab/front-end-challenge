import { InjectionToken } from '@angular/core';
import { SpotifyCredentials } from '../../api/spotify-accounts/spotify-accounts.interfaces';

/** The Spotify app credentials, provided from the environment in `app.config.ts`. */
export const SPOTIFY_CREDENTIALS = new InjectionToken<SpotifyCredentials>('SPOTIFY_CREDENTIALS');
