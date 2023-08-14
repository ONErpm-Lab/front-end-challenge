import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './routes/home/home.component';
import { TracksComponent } from './routes/tracks/tracks.component';
import { HeaderComponent } from './shared/header/header.component';
import { FooterComponent } from './routes/home/footer/footer.component';
import { TrackComponent } from './routes/tracks/track/track.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    TracksComponent,
    HeaderComponent,
    FooterComponent,
    TrackComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    MatCardModule,
    MatProgressSpinnerModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
