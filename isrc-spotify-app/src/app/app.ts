import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SpotifyAuthService } from './core/spotify/spotify-auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private readonly authService = inject(SpotifyAuthService);

  protected readonly title = signal('isrc-spotify-app');

  ngOnInit(): void {
    // Gera o token assim que a aplicação inicializa
    this.authService.generateToken().subscribe({
      next: (token) => {
        console.log('🔐 Token do Spotify gerado com sucesso na inicialização da app');
      },
      error: (error) => {
        console.error('❌ Erro ao gerar token do Spotify na inicialização:', error);
      },
    });
  }
}
