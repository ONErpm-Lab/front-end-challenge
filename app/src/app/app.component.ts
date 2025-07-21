import { Component } from '@angular/core';
import { TracksComponent } from './tracks/tracks.component'; // importe o componente aqui

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TracksComponent], // adicione o componente à lista de imports
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {}
