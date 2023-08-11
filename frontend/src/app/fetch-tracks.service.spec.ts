import { TestBed } from '@angular/core/testing';

import { FetchTracksService } from './fetch-tracks.service';

describe('FetchTracksService', () => {
  let service: FetchTracksService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FetchTracksService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
