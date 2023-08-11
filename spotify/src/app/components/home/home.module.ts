import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { RouterModule, Routes } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { MatGridListModule } from '@angular/material/grid-list';
import { LayoutModule } from '@angular/cdk/layout';
import { MatDialogModule } from '@angular/material/dialog';
import { ApiSpotifyService } from 'src/app/services/api-spotify.service';
import { HomeComponent } from './home.component';
import { DetailsRoutingModule } from '../details/details-routing.module';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
  },
];

@NgModule({
  declarations: [HomeComponent],
  imports: [
    HttpClientModule,
    CommonModule,
    MatCardModule,
    MatGridListModule,
    LayoutModule,
    DetailsRoutingModule,
    MatDialogModule,
    RouterModule.forChild(routes),
  ],
  exports: [RouterModule],
  providers: [ApiSpotifyService],
})
export class HomeModule { }
