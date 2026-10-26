import { TestBed } from '@angular/core/testing';
import { SpotifyIframeApiService } from '../../api/spotify-player/spotify-iframe-api.service';
import { SpotifyEmbedPlayer } from './spotify-embed-player';
import { SpotifyPlayerService } from './spotify-player.service';
import { SpotifyPlayerState } from './spotify-player.enums';

describe('SpotifyPlayerService', () => {
  it('makes a new player each time, idle, on the shared iFrame API', () => {
    const load = vi.fn();
    TestBed.configureTestingModule({
      providers: [{ provide: SpotifyIframeApiService, useValue: { load } }],
    });
    const players = TestBed.inject(SpotifyPlayerService);

    const first = players.create();
    const second = players.create();

    expect(first).toBeInstanceOf(SpotifyEmbedPlayer);
    expect(first).not.toBe(second);
    expect(first.state()).toBe(SpotifyPlayerState.IDLE);
    expect(load).not.toHaveBeenCalled();
  });
});
