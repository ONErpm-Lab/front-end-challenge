import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SpotifyAuthGuard implements CanActivate {
  private readonly router = inject(Router);

  canActivate(): Observable<boolean> {
    console.log('🔒 SpotifyAuthGuard: Verificando credenciais...');
    
    // Verifica se as credenciais estão configuradas e são válidas
    if (this.hasValidCredentials()) {
      console.log('🔒 SpotifyAuthGuard: Credenciais válidas, permitindo acesso');
      return of(true);
    }

    console.log('🔒 SpotifyAuthGuard: Credenciais inválidas, redirecionando para /error');
    
    // Se as credenciais são inválidas, redireciona para a página de erro
    this.router.navigate(['/error'], {
      queryParams: {
        type: 'credentials',
        message: 'Credenciais do Spotify inválidas',
      },
    });
    return of(false);
  }

  private hasValidCredentials(): boolean {
    const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } = environment;
    
    const isValid = !!(
      SPOTIFY_CLIENT_ID &&
      SPOTIFY_CLIENT_SECRET &&
      SPOTIFY_CLIENT_ID !== '112' &&
      SPOTIFY_CLIENT_ID !== '212' &&
      SPOTIFY_CLIENT_SECRET !== 'secret' &&
      SPOTIFY_CLIENT_ID.length >= 10 &&
      SPOTIFY_CLIENT_SECRET.length >= 10
    );
    
    console.log('🔒 SpotifyAuthGuard: Client ID:', SPOTIFY_CLIENT_ID, 'Client Secret:', SPOTIFY_CLIENT_SECRET?.substring(0, 4) + '...', 'Válido:', isValid);
    
    return isValid;
  }
}
