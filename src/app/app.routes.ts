import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'faixas',
    // Lazy on purpose: the shell stays small and the feature's providers are only
    // created for people who actually navigate to it.
    loadChildren: () => import('./features/tracks/tracks.routes').then((m) => m.tracksRoutes),
  },
  { path: '', pathMatch: 'full', redirectTo: 'faixas' },
  { path: '**', redirectTo: 'faixas' },
];
