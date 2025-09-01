import { Routes } from '@angular/router';
import { TracksPageComponent } from './pages/tracks-page/tracks-page.component';

export const TRACKS_ROUTES: Routes = [
  {
    path: '',
    component: TracksPageComponent,
    title: 'ISRC → Spotify - Tracks'
  }
];
