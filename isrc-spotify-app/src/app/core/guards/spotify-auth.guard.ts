import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SpotifyAuthGuard implements CanActivate {
  private readonly router = inject(Router);

  canActivate(): Observable<boolean> {
    if (this.hasValidCredentials()) {
      return of(true);
    }

    this.router.navigate(['/error'], {
      queryParams: {
        type: 'credentials',
        message: 'Credenciais do Spotify inválidas',
      },
    });
    return of(false);
  }

  private hasValidCredentials(): boolean {
    const SPOTIFY_CLIENT_ID = process.env['SPOTIFY_CLIENT_ID'];
    const SPOTIFY_CLIENT_SECRET = process.env['SPOTIFY_CLIENT_SECRET'];

    const isValid = !!(
      SPOTIFY_CLIENT_ID &&
      SPOTIFY_CLIENT_SECRET &&
      SPOTIFY_CLIENT_ID !== '112' &&
      SPOTIFY_CLIENT_ID !== '212' &&
      SPOTIFY_CLIENT_SECRET !== 'secret' &&
      SPOTIFY_CLIENT_ID.length >= 10 &&
      SPOTIFY_CLIENT_SECRET.length >= 10
    );

    return isValid;
  }
}
