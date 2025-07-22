import { Component } from '@angular/core';
import { TracksComponent } from './tracks/tracks.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TracksComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {}
