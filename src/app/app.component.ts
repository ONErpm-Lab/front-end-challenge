import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { TokenService } from './core/token/token.service';
import { SpotifyService } from './services/spotify.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet></router-outlet>',
})
export class AppComponent {
  private spotifyService = inject(SpotifyService);
  private tokenService = inject(TokenService);

  constructor() {
    this.spotifyService
      .generateAccessToken()
      .subscribe((res) => this.tokenService.setToken(res));
  }
}
