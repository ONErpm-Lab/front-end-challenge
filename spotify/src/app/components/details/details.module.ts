import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { HttpClientModule } from '@angular/common/http';
import { LayoutModule } from '@angular/cdk/layout';
import { DetailsComponent } from './details.component';
import { DetailsRoutingModule } from './details-routing.module';
import { ApiSpotifyService } from 'src/app/services/api-spotify.service';

@NgModule({
  declarations: [DetailsComponent],
  imports: [
    HttpClientModule,
    MatButtonModule,
    LayoutModule,
    CommonModule,
    DetailsRoutingModule,
  ],
  providers: [ApiSpotifyService],
})

export class DetailsModule { }
