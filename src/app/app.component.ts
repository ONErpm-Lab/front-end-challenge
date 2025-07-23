import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PlayerComponent } from './features/components/player/player.component';
import { CommonModule } from '@angular/common';
import { SearchComponent } from './features/components/search/search.component';
import { TrackComponent } from './features/components/track/track.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    PlayerComponent,
    SearchComponent,
    TrackComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'challenger-pyou';
  tracks = [];
}
