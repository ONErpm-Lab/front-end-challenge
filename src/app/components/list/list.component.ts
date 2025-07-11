import { Component, ViewChild } from '@angular/core';
import { TokenService } from './../../services/token/token.service';

import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-list',
    imports: [MatButtonModule, MatCardModule, MatPaginatorModule, MatListModule, MatButtonModule, CommonModule],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss'
})
export class ListComponent {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  urlImage = `${environment}`
  movies = [
  {
    poster_path: "movie.poster_path",
    title: "movie.title",
    release_date: new Date(),
    id: "movie.id"
  },
  {
    poster_path: "movie.poster_path",
    title: "movie.title",
    release_date: new Date(),
    id: "movie.id"
  },
  {
    poster_path: "movie.poster_path",
    title: "movie.title",
    release_date: new Date(),
    id: "movie.id"
  },
  {
    poster_path: "movie.poster_path",
    title: "movie.title",
    release_date: new Date(),
    id: "movie.id"
  },
  {
    poster_path: "movie.poster_path",
    title: "movie.title",
    release_date: new Date(),
    id: "movie.id"
  },
  {
    poster_path: "movie.poster_path",
    title: "movie.title",
    release_date: new Date(),
    id: "movie.id"
  },
  {
    poster_path: "movie.poster_path",
    title: "movie.title",
    release_date: new Date(),
    id: "movie.id"
  }
]
  paginateData: any[] = [];
  totalItems = this.movies.length;
  pageSize = 3;
  pageIndex = 0;
 

  constructor(
    private router: Router,
    private tokenService: TokenService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.tokenService.getAccessToken().subscribe({
      next: (res) => {
        this.authService.saveToken(res);
      },
      error: (err) => {
        console.log('>>>>>>>>>>> ERROR', err);
      }
    })
    this.updatePaginatedData();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePaginatedData();
  }

  updatePaginatedData(): void {
    const start = this.pageIndex * this.pageSize;
    const end = start + this.pageSize;
    this.paginateData = this.movies.slice(start, end);
  }

    navigateDetails(id: number): void {
      this.router.navigate(['/details', id]);
    }



}
