import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { TokenService } from './core/token/token.service';
import { SpotifyService } from './services/spotify.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet></router-outlet>',
})
export class AppComponent implements OnInit {
  private spotifyService = inject(SpotifyService);
  private tokenService = inject(TokenService);

  ngOnInit(): void {
    this.spotifyService
      .generateAccessToken()
      .subscribe((res) => this.tokenService.setToken(res));
  }
}
