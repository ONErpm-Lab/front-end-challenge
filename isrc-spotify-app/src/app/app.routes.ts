import { Routes } from '@angular/router';
import { SpotifyAuthGuard } from './core/guards/spotify-auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'tracks',
    pathMatch: 'full',
  },
  {
    path: 'tracks',
    loadChildren: () => import('./modules/tracks/tracks.routes').then((m) => m.TRACKS_ROUTES),
    title: 'ISRC → Spotify',
    canActivate: [SpotifyAuthGuard],
  },
  {
    path: 'error',
    loadComponent: () =>
      import('./modules/shared/pages/error-page/error-page.component').then(
        (m) => m.ErrorPageComponent
      ),
    title: 'Erro - ISRC → Spotify',
  },
  {
    path: '**',
    redirectTo: 'tracks',
  },
];
