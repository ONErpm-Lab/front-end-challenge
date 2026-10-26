import { Injectable, inject } from '@angular/core';
import { SpotifyIframeApiService } from '../../api/spotify-player/spotify-iframe-api.service';
import { SpotifyEmbedPlayer } from './spotify-embed-player';

/** Makes the embedded players, each driving Spotify's iFrame API (loaded once, on the first click). */
@Injectable({ providedIn: 'root' })
export class SpotifyPlayerService {
  private readonly _api = inject(SpotifyIframeApiService);

  public create(): SpotifyEmbedPlayer {
    return new SpotifyEmbedPlayer(this._api);
  }
}
