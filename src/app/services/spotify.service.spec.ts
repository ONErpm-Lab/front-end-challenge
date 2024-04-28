import { TestBed } from '@angular/core/testing';

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { of } from 'rxjs';
import { environment } from '../../environments/environment';
import { endpoints } from '../core/endpoints';
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

  it('#getAllTracks call getTrack for each isrc in the array and order all requests', () => {
    const isrcArray = ['isrc1', 'isrc2', 'isrc3'];
    const mockTracks = [
      {
        tracks: {
          items: [
            /* track1 */
          ],
        },
      },
      {
        tracks: {
          items: [
            /* track2 */
          ],
        },
      },
      {
        tracks: {
          items: [
            /* track3 */
          ],
        },
      },
    ];

    spyOn(service, 'getTrack').and.returnValues(
      ...(mockTracks.map((track) => of(track)) as any)
    );

    service.getAllTracks(isrcArray).subscribe((result) => {
      expect(result.length).toBe(isrcArray.length);
      expect(result[0].isrc).toBe(isrcArray[0]);
      expect(result[1].isrc).toBe(isrcArray[1]);
      expect(result[2].isrc).toBe(isrcArray[2]);
    });
  });
});
