import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { switchMap, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth/auth.service';
import { SpotfyService } from '../../services/spotfy/spotfy.service';
import { TokenService } from '../../services/token/token.service';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, MatPaginatorModule, MatListModule, CommonModule],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss'
})
export class ListComponent {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  urlImage = environment.search || 'https://via.placeholder.com/300';
  tracks: any[] = [];
  paginateData: any[] = [];
  totalItems = 0;
  pageSize = 3;
  pageIndex = 0;
  missingIsrcs: string[] = [];
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
        this.tracks = tracks.filter(track => !!track);
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
}