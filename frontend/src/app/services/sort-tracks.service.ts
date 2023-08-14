import { Injectable } from '@angular/core';
import { Track } from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class SortTracksService {
  sortTracksByName(tracks: Track[]): Track[] {
    const sortedTracks: Track[] = 
      tracks.sort((a: Track, b: Track) => {
        const trackAName = a.name.toUpperCase();
        const trackBName = b.name.toUpperCase();

        if(trackAName < trackBName) {
          return -1;
        }
        if(trackAName > trackBName) {
          return 1;
        }
        return 0;
      });
    
    return sortedTracks;
  }
}
