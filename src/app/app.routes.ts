import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./components/home/home.component').then((c) => c.HomeComponent),
  },
  {
    path: 'track-info/:isrc',
    loadComponent: () =>
      import('./components/track-info/track-info.component').then(
        (c) => c.TrackInfoComponent
      ),
  },
  {
    path: 'tracks',
    loadComponent: () =>
      import('./components/tracks/tracks.component').then(
        (c) => c.TracksComponent
      ),
  },
];
