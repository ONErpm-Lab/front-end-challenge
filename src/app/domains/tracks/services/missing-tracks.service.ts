import { Injectable } from '@angular/core';
import { ISRCMissingTracks } from '../types/tracks.types';
import { SpotifyService } from '../../spotify/services/spotify.service';
import { forkJoin, map, Observable } from 'rxjs';
import { IMultipleSpotifySearchResponse } from '../../spotify/types/spotify.types';

@Injectable({
  providedIn: 'root',
})

export class MissingTracksService {
  constructor(private spotifyService: SpotifyService) {}

  getMissingTracks(): Observable<IMultipleSpotifySearchResponse> {
    const missingTracks = Object.values(ISRCMissingTracks);

    const searchRequests = missingTracks.map(isrc => 
      this.spotifyService.search(`isrc:${isrc}`, 'track', 1).pipe(
        map(response => ({
          isrc,
          track: response.tracks?.items?.[0] || null
        }))
      )
    );

    return forkJoin(searchRequests);
  }
}
