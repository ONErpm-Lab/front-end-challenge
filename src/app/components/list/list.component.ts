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
  tracksWithPreview = 0;
  tracksWithoutPreview = 0;
  tracksAvailableInBrazil = 0;
  tracksUnavailableInBrazil = 0;
  isrcs = [
    'USAT21703861', 
    'USUG12000001', 
    'GBUM71505078', 
    'USRC17607839',
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
    private spotfyService: SpotfyService
  ) {}

  ngOnInit(): void {
    this.tokenService.getAccessToken().pipe(
      tap((token) => this.authService.saveToken(token)),
      switchMap(() => this.spotfyService.getTracksByIsrcs([...this.isrcs])) // Cria uma cópia para evitar mutação
    ).subscribe({
      next: (tracks) => {
        console.log('Tracks retornadas:', tracks);
        this.tracks = tracks.filter(track => !!track);
        console.log('Tracks filtradas:', this.tracks);
        
        this.tracksWithPreview = this.tracks.filter(track => track.preview_url).length;
        this.tracksWithoutPreview = this.tracks.filter(track => !track.preview_url).length;
        
        this.tracksAvailableInBrazil = this.tracks.filter(track => this.availableRangeInBrazil(track)).length;
        this.tracksUnavailableInBrazil = this.tracks.filter(track => !this.availableRangeInBrazil(track)).length;
        
        console.log(`Total de tracks: ${this.tracks.length}`);
        console.log(`Com preview: ${this.tracksWithPreview}`);
        console.log(`Sem preview: ${this.tracksWithoutPreview}`);
        console.log(`Disponíveis no Brasil: ${this.tracksAvailableInBrazil}`);
        console.log(`Indisponíveis no Brasil: ${this.tracksUnavailableInBrazil}`);
        
        // Log para verificar preview_url
        this.tracks.forEach((track, index) => {
          console.log(`Track ${index}:`, track.name, 'Preview URL:', track.preview_url || 'Não disponível');
        });
        
        this.missingIsrcs = this.isrcs.filter((_, i) => !tracks[i]);
        this.totalItems = this.tracks.length;
        this.updatePaginatedData();
      },
      error: (err) => {
        console.error('>>>>>>>>>>> Erro ao buscar faixas:', err);
      }
    });
  }

  onPageChange(event: PageEvent): void {
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

  availableRangeInBrazil(track: any): boolean {
    return track?.is_playable === true;
  }

  getBrazilAvailabilityStatus(track: any): { available: boolean, text: string, icon: string } {
    const available = this.availableRangeInBrazil(track);
    return {
      available,
      text: available ? 'Disponível no Brasil' : 'Não disponível no Brasil',
      icon: available ? 'check_circle' : 'cancel'
    };
  }

  ngOnDestroy(): void {
    this.pauseAudio();
  }
}