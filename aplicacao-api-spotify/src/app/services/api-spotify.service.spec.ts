import { TestBed } from '@angular/core/testing';

import { ApiSpotifyService } from './api-spotify.service';

describe('ApiSpotifyService', () => {
  let service: ApiSpotifyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApiSpotifyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
