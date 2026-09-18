import { Routes } from '@angular/router';
import { environment } from '../../../environments/environment';
import { FixtureTrackRepository } from './data/fixture-track.repository';
import { SpotifyTrackRepository } from './data/spotify-track.repository';
import { TrackRepository } from './domain/track-repository';

/**
 * Lazy-loaded feature routes.
 *
 * The provider binding lives here rather than in `app.config.ts` so the chosen
 * implementation is only constructed for people who actually open the feature, and
 * so swapping it stays a one-line change inside the feature that owns the contract.
 *
 * TODO(spotify-403): the `useFixtures` branch is temporary — see `FixtureTrackRepository`.
 * Removing it leaves the Spotify binding this file always had.
 */
export const tracksRoutes: Routes = [
  {
    path: '',
    providers: [
      {
        provide: TrackRepository,
        useClass: environment.useFixtures ? FixtureTrackRepository : SpotifyTrackRepository,
      },
    ],
    loadComponent: () => import('./ui/tracks-page').then((m) => m.TracksPage),
  },
];
