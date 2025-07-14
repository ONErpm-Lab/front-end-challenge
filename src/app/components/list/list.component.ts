import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { Subject, switchMap, takeUntil, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth/auth.service';
import { AudioPlayerService } from '../../services/audio/audio-player.service';
import { NotificationService } from '../../services/notification/notification.service';
import { PaginationService, PaginationState } from '../../services/pagination/pagination.service';
import { SpotfyService } from '../../services/spotfy/spotfy.service';
import { TokenService } from '../../services/token/token.service';
import { TrackUtilsService } from '../../services/track-utils/track-utils.service';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, MatPaginatorModule, MatListModule, MatIconModule, MatProgressSpinnerModule, MatTooltipModule, CommonModule],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss'
})
export class ListComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  
  private destroy$ = new Subject<void>();
  
  urlImage = environment.search || 'https://via.placeholder.com/300';
  tracks: any[] = [];
  missingIsrcs: string[] = [];
  activePaginator = false;
  paginationState!: PaginationState;
  currentPlayingId: string | null = null;
  
  // Adicione esta propriedade getter para o template
  get paginateData(): any[] {
    return this.paginationState?.paginatedData || [];
  }
  
  private lastPagination = 0;
  private readonly isrcs = [
    'US7VG1846811',
    'US7QQ1846811',
    'BRC310600002',
    'BR1SP1200071',
    'BR1SP1200070',
    'BR1SP1500002',
    'BXKZM1900338',
    'BXKZM1900345',
    'QZNJX2081700',
    'QZNJX2078148'
  ];

  constructor(
    private router: Router,
    private tokenService: TokenService,
    private authService: AuthService,
    private spotfyService: SpotfyService,
    private notificationService: NotificationService,
    private audioPlayerService: AudioPlayerService,
    private trackUtilsService: TrackUtilsService,
    private paginationService: PaginationService
  ) {
    this.setupSubscriptions();
  }

  ngOnInit(): void {
    this.getTracks();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.audioPlayerService.destroy();
  }

  private setupSubscriptions(): void {
    this.paginationService.paginationState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => this.paginationState = state);

    this.audioPlayerService.currentPlayingId$
      .pipe(takeUntil(this.destroy$))
      .subscribe(id => this.currentPlayingId = id);

    this.notificationService.getNotification()
      .pipe(takeUntil(this.destroy$))
      .subscribe(this.handleNotification.bind(this));
  }

  onPageChange(event: PageEvent): void {
    this.lastPagination = event.pageSize;
    this.paginationService.updatePagination(event.pageIndex, event.pageSize, this.tracks);
  }

  navigateDetails(id: string): void {
    this.router.navigate(['/details', id]);
  }

  toggleAudio(track: any): void {
    this.audioPlayerService.togglePlay(track);
  }

  isPlaying(trackId: string): boolean {
    return this.audioPlayerService.isPlaying(trackId);
  }

  formatDuration(durationMs: number): string {
    return this.trackUtilsService.formatDuration(durationMs);
  }

  getArtistsNames(artists: any[]): string {
    return this.trackUtilsService.getArtistsNames(artists);
  }

  hasValidPreview(track: any): boolean {
    return this.trackUtilsService.hasValidPreview(track);
  }

  openSpotify(track: any): void {
    this.trackUtilsService.openSpotify(track);
  }

  private getTracks(): void {
    this.tokenService.getAccessToken().pipe(
      tap((token) => this.authService.saveToken(token)),
      switchMap(() => this.spotfyService.getTracksByIsrcs([...this.isrcs])),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (tracks) => {
        this.tracks = tracks;
        this.missingIsrcs = this.isrcs.filter((_, i) => !tracks[i]);
        this.paginationService.updatePagination(0, 10, this.tracks);
      },
      error: (err) => {
        console.error('>>>>>>>>>>> Erro ao buscar faixas:', err);
      }
    });
  }

  private handleNotification(res: boolean): void {
    console.log('Notification received, updating track list...', res);
    if (res) {
      this.activePaginator = true;
      this.handleLastPagination();
    } else {
      this.activePaginator = false;
      this.paginationService.setPageSize(this.tracks.length, this.tracks);
    }
  }

  private handleLastPagination(): void {
    const pageSize = this.lastPagination !== 0 ? this.lastPagination : 5;
    this.lastPagination = pageSize;
    this.paginationService.setPageSize(pageSize, this.tracks);
  }

    // Para a opção 1 (Tooltip)
  getTruncatedArtists(artists: any[]): string {
    if (artists.length <= 2) {
      return this.trackUtilsService.getArtistsNames(artists);
    }
    return `${artists.slice(0, 2).map(artist => artist.name).join(', ')}`;
  }

  getArtistsTooltip(artists: any[]): string {
    return artists.map((artist, index) => `${index + 1}. ${artist.name}`).join('\n');
  }
}