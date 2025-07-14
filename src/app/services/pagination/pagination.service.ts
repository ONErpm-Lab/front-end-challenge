import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface PaginationState {
  pageIndex: number;
  pageSize: number;
  totalItems: number;
  paginatedData: any[];
}

@Injectable({
  providedIn: 'root'
})
export class PaginationService {
  private paginationState = new BehaviorSubject<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
    totalItems: 0,
    paginatedData: []
  });

  paginationState$ = this.paginationState.asObservable();

  updatePagination(pageIndex: number, pageSize: number, data: any[]): void {
    const start = pageIndex * pageSize;
    const end = start + pageSize;
    const paginatedData = data.slice(start, end);

    this.paginationState.next({
      pageIndex,
      pageSize,
      totalItems: data.length,
      paginatedData
    });
  }

  setPageSize(pageSize: number, data: any[]): void {
    const currentState = this.paginationState.value;
    this.updatePagination(currentState.pageIndex, pageSize, data);
  }

  getCurrentState(): PaginationState {
    return this.paginationState.value;
  }
}