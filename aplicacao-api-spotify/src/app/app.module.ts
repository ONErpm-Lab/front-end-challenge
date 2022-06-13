import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';

import { TracksListComponent } from './routes/tracks/tracks-list/tracks-list.component';
import { NgpSortModule } from 'ngp-sort-pipe';

@NgModule({
  declarations: [
    AppComponent,
    TracksListComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    NgpSortModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
