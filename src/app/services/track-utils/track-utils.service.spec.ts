import { TestBed } from '@angular/core/testing';

import { TrackUtilsService } from './track-utils.service';

describe('TrackUtilsService', () => {
  let service: TrackUtilsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TrackUtilsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
