import { TestBed } from "@angular/core/testing";

import { PaginationService } from "./pagination.service";

describe("PaginationService", () => {
  let service: PaginationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PaginationService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("updatePagination", () => {
    it("should update pagination state with correct values for first page", () => {
      const testData = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const pageIndex = 0;
      const pageSize = 3;

      service.updatePagination(pageIndex, pageSize, testData);

      const state = service.getCurrentState();
      expect(state.pageIndex).toBe(0);
      expect(state.pageSize).toBe(3);
      expect(state.totalItems).toBe(10);
      expect(state.paginatedData).toEqual([1, 2, 3]);
    });

    it("should update pagination state with correct values for middle page", () => {
      const testData = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const pageIndex = 1;
      const pageSize = 3;

      service.updatePagination(pageIndex, pageSize, testData);

      const state = service.getCurrentState();
      expect(state.pageIndex).toBe(1);
      expect(state.pageSize).toBe(3);
      expect(state.totalItems).toBe(10);
      expect(state.paginatedData).toEqual([4, 5, 6]);
    });

    it("should handle last page with fewer items than page size", () => {
      const testData = [1, 2, 3, 4, 5];
      const pageIndex = 2;
      const pageSize = 3;

      service.updatePagination(pageIndex, pageSize, testData);

      const state = service.getCurrentState();
      expect(state.pageIndex).toBe(2);
      expect(state.pageSize).toBe(3);
      expect(state.totalItems).toBe(5);
      expect(state.paginatedData).toEqual([]);
    });

    it("should handle empty data array", () => {
      const testData: any[] = [];
      const pageIndex = 0;
      const pageSize = 5;

      service.updatePagination(pageIndex, pageSize, testData);

      const state = service.getCurrentState();
      expect(state.pageIndex).toBe(0);
      expect(state.pageSize).toBe(5);
      expect(state.totalItems).toBe(0);
      expect(state.paginatedData).toEqual([]);
    });

    it("should emit updated state through observable", (done) => {
      const testData = [1, 2, 3, 4, 5];
      const pageIndex = 1;
      const pageSize = 2;

      service.paginationState$.subscribe((state) => {
        if (state.pageIndex === pageIndex) {
          expect(state.pageSize).toBe(2);
          expect(state.totalItems).toBe(5);
          expect(state.paginatedData).toEqual([3, 4]);
          done();
        }
      });

      service.updatePagination(pageIndex, pageSize, testData);
    });
  });

  it("should update page size while maintaining current page index", () => {
    const testData = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    // First set initial pagination state
    service.updatePagination(1, 3, testData); // Page 1, size 3, should show [4, 5, 6]

    // Then change page size
    service.setPageSize(5, testData);

    const state = service.getCurrentState();
    expect(state.pageIndex).toBe(1); // Should maintain current page index
    expect(state.pageSize).toBe(5); // Should update to new page size
    expect(state.totalItems).toBe(10);
    expect(state.paginatedData).toEqual([6, 7, 8, 9, 10]); // Page 1 with size 5
  });
});
