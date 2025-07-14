import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TrackUtilsService {

  formatDuration(durationMs: number): string {
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  getArtistsNames(artists: any[]): string {
    return artists?.map(artist => artist.name).join(', ') || '';
  }

  hasValidPreview(track: any): boolean {
    const hasPreview = track && track.preview_url && track.preview_url !== null && track.preview_url !== '';
    console.log(`Track ${track?.name} has valid preview:`, hasPreview, 'URL:', track?.preview_url);
    return hasPreview;
  }

  openSpotify(track: any): void {
    if (track?.external_urls?.spotify) {
      window.open(track.external_urls.spotify, '_blank');
    }
  }
}