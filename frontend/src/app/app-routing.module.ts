import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { routeComponents } from './routes';

const routes: Routes = [
  { path: '', component: routeComponents.home },
  { path: 'tracks', component: routeComponents.tracks },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
