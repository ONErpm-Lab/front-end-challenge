import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { map } from 'rxjs/operators';
import { ISpotifyGateway } from './spotify-gateway.interface';
import { ITrack } from '../../modules/tracks/models';

@Injectable({
  providedIn: 'root'
})
export class MockSpotifyGatewayService implements ISpotifyGateway {
  
  private readonly mockTracks: Array<ITrack> = [
    {
      id: '1',
      name: 'Bohemian Rhapsody',
      artists: [{ id: '1', name: 'Queen', external_urls: { spotify: 'https://open.spotify.com/artist/1' } }],
      album: {
        id: '1',
        name: 'A Night at the Opera',
        images: [
          { url: 'https://via.placeholder.com/300x300', height: 300, width: 300 },
          { url: 'https://via.placeholder.com/64x64', height: 64, width: 64 }
        ],
        release_date: '1975-11-21',
        release_date_precision: 'day',
        external_urls: { spotify: 'https://open.spotify.com/album/1' }
      },
      duration_ms: 354000,
      preview_url: 'https://example.com/preview1.mp3',
      external_urls: { spotify: 'https://open.spotify.com/track/1' },
      available_markets: ['BR', 'US', 'GB'],
      isrc: 'US7VG1846811'
    },
    {
      id: '2',
      name: 'Hotel California',
      artists: [{ id: '2', name: 'Eagles', external_urls: { spotify: 'https://open.spotify.com/artist/2' } }],
      album: {
        id: '2',
        name: 'Hotel California',
        images: [
          { url: 'https://via.placeholder.com/300x300', height: 300, width: 300 },
          { url: 'https://via.placeholder.com/64x64', height: 64, width: 64 }
        ],
        release_date: '1976-12-08',
        release_date_precision: 'day',
        external_urls: { spotify: 'https://open.spotify.com/album/2' }
      },
      duration_ms: 391000,
      preview_url: 'https://example.com/preview2.mp3',
      external_urls: { spotify: 'https://open.spotify.com/track/2' },
      available_markets: ['BR', 'US'],
      isrc: 'US7QQ1846811'
    }
  ];

  // Métodos Promise removidos - use os Observables diretamente

  // Método para simular delay de rede
  searchTrackByISRCObservable(isrc: string): Observable<ITrack | null> {
    return of(this.mockTracks.find(t => t.isrc === isrc) || null).pipe(
      delay(500) // Simula delay de rede
    );
  }

  searchTracksByISRCsObservable(isrcs: Array<string>): Observable<Array<ITrack>> {
    const tracks = this.mockTracks.filter(t => isrcs.includes(t.isrc));
    return of(tracks).pipe(
      delay(800) // Simula delay de rede
    );
  }
}
