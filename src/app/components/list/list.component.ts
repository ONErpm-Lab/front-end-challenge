import { CommonModule } from '@angular/common';
import { Component, OnDestroy, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { switchMap, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth/auth.service';
import { NotificationService } from '../../services/notification/notification.service';
import { SpotfyService } from '../../services/spotfy/spotfy.service';
import { TokenService } from '../../services/token/token.service';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, MatPaginatorModule, MatListModule, MatIconModule, MatProgressSpinnerModule, CommonModule],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss'
})
export class ListComponent implements OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  urlImage = environment.search || 'https://via.placeholder.com/300';
  tracks: any[] = [];
  paginateData: any[] = [];
  totalItems = 0;
  pageSize = 10;
  pageIndex = 0;
  missingIsrcs: string[] = [];
  currentPlayingId: string | null = null;
  currentAudio: HTMLAudioElement | null = null;
  isrcs = [
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
  activePaginator = false;
  private lastPagination = 0;


  constructor(
    private router: Router,
    private tokenService: TokenService,
    private authService: AuthService,
    private spotfyService: SpotfyService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.listeningNotificationEvent();
    this.getTracks();
  }

  onPageChange(event: PageEvent): void {
    this.lastPagination = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePaginatedData();
  }

  updatePaginatedData(): void {
    const start = this.pageIndex * this.pageSize;
    const end = start + this.pageSize;
    this.paginateData = this.tracks.slice(start, end);
  }

  navigateDetails(id: string): void {
    this.router.navigate(['/details', id]);
  }

  toggleAudio(track: any): void {
    if (this.isPlaying(track.id)) {
      this.pauseAudio();
    } else {
      this.playAudio(track);
    }
  }

  playAudio(track: any): void {
    this.pauseAudio();
    
    if (track.preview_url) {
      this.currentAudio = new Audio(track.preview_url);
      this.currentPlayingId = track.id;
      
      this.currentAudio.addEventListener('ended', () => {
        this.onAudioEnded(track.id);
      });
      
      this.currentAudio.play().catch(error => {
        console.error('Erro ao reproduzir áudio:', error);
        this.onAudioError(track.id);
      });
    }
  }

  pauseAudio(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
      this.currentPlayingId = null;
    }
  }

  isPlaying(trackId: string): boolean {
    return this.currentPlayingId === trackId && !!this.currentAudio && !this.currentAudio.paused;
  }

  onAudioEnded(trackId: string): void {
    if (this.currentPlayingId === trackId) {
      this.currentPlayingId = null;
      this.currentAudio = null;
    }
  }

  onAudioLoadStart(trackId: string): void {
    console.log('Carregando áudio para:', trackId);
  }

  onAudioError(trackId: string): void {
    console.error('Erro ao carregar áudio para:', trackId);
    if (this.currentPlayingId === trackId) {
      this.currentPlayingId = null;
      this.currentAudio = null;
    }
  }

  formatDuration(durationMs: number): string {
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  getArtistsNames(artists: any[]): string {
    return artists.map(artist => artist.name).join(', ');
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

  ngOnDestroy(): void {
    this.pauseAudio();
  }

  private getTracks(): void {
      this.tokenService.getAccessToken().pipe(
      tap((token) => this.authService.saveToken(token)),
      switchMap(() => this.spotfyService.getTracksByIsrcs([...this.isrcs]))
    ).subscribe({
      next: (tracks) => {
        this.tracks = tracks;
        this.missingIsrcs = this.isrcs.filter((_, i) => !tracks[i]);
        this.totalItems = this.tracks.length;
        this.updatePaginatedData();
      },
      error: (err) => {
        console.error('>>>>>>>>>>> Erro ao buscar faixas:', err);
      }
    });
  }

    listeningNotificationEvent(): void {
    this.notificationService.getNotification().subscribe((res: boolean) => {
      console.log('Notification received, updating track list...', res);
      if (res) {
        this.activePaginator = true;
        this.lastPaginationIsCall();
        return;
      }
      this.activePaginator = false;
      this.pageSize = this.tracks.length;
      this.updatePaginatedData();

    });
  }

  private lastPaginationIsCall(): void {
    if (this.lastPagination !== 0) {
      this.pageSize = this.lastPagination;
      this.updatePaginatedData();
      return;
    }
    this.pageSize = 5;
    this.lastPagination = 5;
    this.updatePaginatedData()
  }
}