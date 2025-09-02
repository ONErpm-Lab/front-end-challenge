import { Component, signal, inject, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { SpotifyAuthService } from './core/spotify/spotify-auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private readonly authService = inject(SpotifyAuthService);
  private readonly router = inject(Router);
  protected readonly title = signal('isrc-spotify-app');

  ngOnInit(): void {
    this.authService.generateToken().subscribe({
      next: (token) => {
        console.log('🔐 Token do Spotify gerado com sucesso na inicialização da app');
        this.router.navigate(['/tracks']);
      },
      error: (error) => {
        console.error('❌ Erro ao gerar token do Spotify na inicialização:', error);
        this.router.navigate(['/error'], {
          queryParams: {
            type: 'credentials',
            message: 'Credenciais do Spotify inválidas',
          },
        });
      },
    });
  }
}
