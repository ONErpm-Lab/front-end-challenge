import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/tracks/pages/catalog-page/catalog-page.component').then(
        (m) => m.CatalogPageComponent,
      ),
  },
  { path: '**', redirectTo: '' },
];
