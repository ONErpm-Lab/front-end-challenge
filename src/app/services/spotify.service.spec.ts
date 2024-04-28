import { TestBed } from '@angular/core/testing';

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { environment } from '../../environments/environment';
import { endpoints } from '../core/endpoints';
import isrcList from '../data/isrc-list.data';
import { accessTokenMock } from '../tests/mocks/access-token.mock';
import { isrcMock, spotifySearchContentMock } from '../tests/mocks/track-mock';
import { SpotifyService } from './spotify.service';

describe('SpotifyService', () => {
  let service: SpotifyService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(SpotifyService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('#generateAccessToken should generate access token', () => {
    const credentials = btoa(
      `${environment.spotifyClientID}:${environment.spotifyClientSecret}`
    );

    service.generateAccessToken().subscribe((accessToken) => {
      expect(accessToken)
        .withContext('checks if accessToken is the same as the mock')
        .toEqual(accessTokenMock);
    });

    const req = httpTestingController.expectOne(endpoints.accessToken);

    expect(req.request.method)
      .withContext('checks if the method used is POST')
      .toBe('POST');

    expect(req.request.headers.get('Content-Type'))
      .withContext('checks if the request headers has the correct Content-Type')
      .toBe('application/x-www-form-urlencoded');

    expect(req.request.headers.get('Authorization'))
      .withContext('checks if the Authorization has the correct value')
      .toBe(`Basic ${credentials}`);

    req.flush(accessTokenMock);
  });

  it('#getTrack should get track', () => {
    service.getTrack(isrcMock).subscribe((searchContent) => {
      expect(searchContent)
        .withContext('checks is the contents matches')
        .toEqual(spotifySearchContentMock);
    });

    const req = httpTestingController.expectOne(
      `${endpoints.search}?q=isrc:${isrcMock}&type=track`
    );
    expect(req.request.method)
      .withContext('checks if the method used is GET')
      .toBe('GET');
    req.flush(spotifySearchContentMock);
  });

  it('should call getTrack for each isrc in the array', () => {
    const spy = spyOn(service, 'getTrack');

    const multiTrack$ = service.getAllTracks(isrcList);

    expect(spy).toHaveBeenCalledTimes(10);
  });
});
