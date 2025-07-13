import { Routes } from '@angular/router';

export const tracksRoutes: Routes = [
  {
    path: '',
    redirectTo: 'missing-tracks',
    pathMatch: 'full',
  },
  {
    path: 'missing-tracks',
    loadComponent: () => import('../pages/missing-tracks/missing-tracks.page').then((m) => m.MissingTracksPage),
  },
];
