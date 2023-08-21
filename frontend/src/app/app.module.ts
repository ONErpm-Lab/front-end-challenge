import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';

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
    TrackComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    MatIconModule,
    MatCardModule,
    MatToolbarModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatButtonModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
