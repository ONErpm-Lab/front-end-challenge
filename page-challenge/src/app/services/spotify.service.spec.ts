import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SpotifyService } from './spotify.service';
import { environment } from '../../environments/environment';
import { AllTrackProps } from '../interfaces/track.intercafe';

describe('SpotifyService', () => {
  let service: SpotifyService;
  let httpMock: HttpTestingController;


  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SpotifyService]
    });

    service = TestBed.inject(SpotifyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get track by ISRC', () => {
    const isrc = 'ISRC_DO_TRACK';

    const mockTrackResponse: AllTrackProps = {
      tracks: {
        href: 'some-url',
        items: [],
        limit: 1,
        next: null,
        offset: 0,
        previous: null,
        total: 0
      }
    };

    service.getTrackByISRC(isrc).subscribe(tracks => {
      expect(tracks).toEqual(mockTrackResponse);
    });

    const req = httpMock.expectOne({
      method: 'GET',
      url: `${environment.spotify.baseUrl}/search?q=isrc:${isrc}&type=track`
    });

    expect(req.request.headers.get('Authorization')).toEqual(`Bearer ${environment.accessToken}`);
    expect(req.request.headers.get('Content-Type')).toEqual('application/json');
    req.flush(mockTrackResponse);
  });
});