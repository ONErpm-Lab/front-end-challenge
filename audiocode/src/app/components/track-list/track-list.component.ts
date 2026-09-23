import { Component, OnInit } from '@angular/core';
import { AsyncPipe, DatePipe } from '@angular/common';
import { forkJoin, Observable } from 'rxjs';
import { TrackData } from '../../models/track.model';
import { SpotifyService } from '../../services/spotify.service';
import { TrackItemComponent } from '../track-item/track-item.component';

@Component({
  selector: 'app-track-list-page',
  standalone: true,
  imports: [AsyncPipe, DatePipe, TrackItemComponent],
  templateUrl: './track-list.component.html',
  styleUrls: ['./track-list.component.scss']
})
export class TrackListPageComponent implements OnInit {
  tracks$!: Observable<(TrackData | null)[]>;
  selectedTrack: TrackData | null = null;
  searchTerm = '';
  isLoading = true;
  hasError = false;
  errorMessage = '';

  readonly isrcs = [
    'NO1R42509310',
    'NO1R42511410',
    'BRC310600002',
    'BR1SP1200071',
    'BR1SP1200070',
    'BR1SP1500002',
    'BXKZM1900338',
    'BXKZM1900345',
    'QZNJX2081700',
    'QZNJX2078148'
  ];

  constructor(private spotifyService: SpotifyService) {}

  ngOnInit(): void {
    this.loadTracks();
  }

  loadTracks(): void {
    this.isLoading = true;
    this.hasError = false;

    this.tracks$ = forkJoin(
      this.isrcs.map((isrc) => this.spotifyService.searchTrackByIsrc(isrc))
    ).pipe(
    );

    // Subscribe to handle loading and error states
    this.tracks$.subscribe({
      next: (tracks) => {
        this.isLoading = false;
        this.selectedTrack = this.getSortedTracks(tracks)[0] ?? null;
      },
      error: (error) => {
        this.isLoading = false;
        this.hasError = true;
        this.errorMessage = 'Erro ao carregar as faixas. Verifique sua conexão ou tente novamente mais tarde.';
        console.error('Error loading tracks:', error);
      }
    });
  }

  /**
   * Filters out null tracks and sorts by title
   */
  getSortedTracks(tracks: (TrackData | null)[]): TrackData[] {
    return tracks
      .filter((track): track is TrackData => track !== null)
      .sort((a, b) => a.title.localeCompare(b.title));
  }

  getFilteredTracks(tracks: (TrackData | null)[]): TrackData[] {
    const search = this.normalizeSearchTerm(this.searchTerm);

    return this.getSortedTracks(tracks).filter((track) => {
      if (!search) {
        return true;
      }

      const title = this.normalizeSearchTerm(track.title);
      const artists = this.normalizeSearchTerm(track.artists.join(' '));
      return title.includes(search) || artists.includes(search);
    });
  }

  private normalizeSearchTerm(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase();
  }

  toggleTrack(track: TrackData): void {
    this.selectedTrack = this.selectedTrack?.isrc === track.isrc ? null : track;
  }
}