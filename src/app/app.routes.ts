import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full',
  },
  {
    path: 'list',
    loadComponent: () =>
      import('./components/list/list.component').then((l) => l.ListComponent),
  },
  {
    path: 'detail',
    loadComponent: () =>
      import('./components/detail/detail.component').then((d) => d.DetailComponent),
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];
