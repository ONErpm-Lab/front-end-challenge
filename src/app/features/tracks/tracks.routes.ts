import { Routes } from '@angular/router';
import { SpotifyTrackRepository } from './data/spotify-track.repository';
import { TrackRepository } from './domain/track-repository';

/**
 * Lazy-loaded feature routes.
 *
 * The provider binding lives here rather than in `app.config.ts` so the Spotify
 * implementation is only constructed for people who actually open the feature, and
 * so swapping it stays a one-line change inside the feature that owns the contract.
 */
export const tracksRoutes: Routes = [
  {
    path: '',
    providers: [{ provide: TrackRepository, useClass: SpotifyTrackRepository }],
    loadComponent: () => import('./ui/tracks-page').then((m) => m.TracksPage),
  },
];
