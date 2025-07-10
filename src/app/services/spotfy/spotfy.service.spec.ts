import { TestBed } from '@angular/core/testing';

import { SpotfyService } from './spotfy.service';

describe('SpotfyService', () => {
  let service: SpotfyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SpotfyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
