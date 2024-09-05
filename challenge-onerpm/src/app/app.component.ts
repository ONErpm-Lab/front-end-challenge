import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SpotifyService } from './services/spotify.service';
import { environment } from '../environments/environment';
import { IsrcListComponent } from './isrc-list/isrc-list.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    IsrcListComponent
],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit{
  title = 'challenge-onerpm';

  successMessage: string | null = null;
  errorMessage: string | null = null;

  constructor(private spotifyService: SpotifyService) {}

  ngOnInit(): void {
    this.spotifyService.authenticate().subscribe({
      next: (token) => {
        this.successMessage = 'Autenticado com sucesso!';
      },
      error: (error) => {
        this.errorMessage = 'Erro ao autenticar. Por favor, tente novamente.';
      }
    })
  }
}
