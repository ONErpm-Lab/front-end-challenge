import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'tracks',
    pathMatch: 'full'
  },
  {
    path: 'tracks',
    loadChildren: () => import('./modules/tracks/tracks.routes').then(m => m.TRACKS_ROUTES),
    title: 'ISRC → Spotify'
  },
  {
    path: '**',
    redirectTo: 'tracks'
  }
];
