import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { SpotfyService } from './spotfy.service';

fdescribe('SpotfyService', () => {
  let service: SpotfyService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(SpotfyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getTrackByIsrc', () => {
    it('should return track data when ISRC is found', () => {
      const mockIsrc = 'USUM71703861';
      const mockSearchResponse = {
        tracks: {
          items: [{ id: 'track123' }]
        }
      };
      const mockTrackResponse = {
        id: 'track123',
        name: 'Test Track',
        artists: [{ name: 'Test Artist' }]
      };

      service.getTrackByIsrc(mockIsrc).subscribe(result => {
        expect(result).toEqual(mockTrackResponse);
      });

      const searchReq = httpMock.expectOne(`https://api.spotify.com/v1/search?q=isrc:${mockIsrc}&type=track&market=BR`);
      searchReq.flush(mockSearchResponse);

      const trackReq = httpMock.expectOne(`https://api.spotify.com/v1/tracks/track123?market=BR`);
      trackReq.flush(mockTrackResponse);
    });

    it('should return null when ISRC is not found', () => {
      const mockIsrc = 'INVALID123';
      const mockSearchResponse = {
        tracks: {
          items: []
        }
      };

      service.getTrackByIsrc(mockIsrc).subscribe(result => {
        expect(result).toBeNull();
      });

      const searchReq = httpMock.expectOne(`https://api.spotify.com/v1/search?q=isrc:${mockIsrc}&type=track&market=BR`);
      searchReq.flush(mockSearchResponse);
    });

    it('should handle HTTP errors and return null', () => {
      const mockIsrc = 'ERROR123';

      service.getTrackByIsrc(mockIsrc).subscribe(result => {
        expect(result).toBeNull();
      });

      const searchReq = httpMock.expectOne(`https://api.spotify.com/v1/search?q=isrc:${mockIsrc}&type=track&market=BR`);
      searchReq.error(new ErrorEvent('Network error'));
    });

    it('should handle getTrackById HTTP errors and return null', () => {
      const mockIsrc = 'VALID_ISRC';
      const mockSearchResponse = {
        tracks: {
          items: [{ id: 'track123' }]
        }
      };

      service.getTrackByIsrc(mockIsrc).subscribe(result => {
        expect(result).toBeNull();
      });

      // A busca do ISRC retorna sucesso
      const searchReq = httpMock.expectOne(`https://api.spotify.com/v1/search?q=isrc:${mockIsrc}&type=track&market=BR`);
      searchReq.flush(mockSearchResponse);

      // Mas a busca da track por ID falha (testando o catchError do getTrackById)
      const trackReq = httpMock.expectOne(`https://api.spotify.com/v1/tracks/track123?market=BR`);
      trackReq.error(new ErrorEvent('Track fetch error'), { status: 404, statusText: 'Not Found' });
    });
  });

  describe('getTracksByIsrcs', () => {
    it('should return array of tracks for multiple ISRCs', fakeAsync(() => {
      const mockIsrcs = ['ISRC1', 'ISRC2'];
      const mockSearchResponse1 = { tracks: { items: [{ id: 'track1' }] } };
      const mockSearchResponse2 = { tracks: { items: [{ id: 'track2' }] } };
      const mockTrackResponse1 = { id: 'track1', name: 'Track 1' };
      const mockTrackResponse2 = { id: 'track2', name: 'Track 2' };

      let result: any;
      service.getTracksByIsrcs(mockIsrcs).subscribe(res => {
        result = res;
      });

      tick(100);
      
      const searchReq1 = httpMock.expectOne(`https://api.spotify.com/v1/search?q=isrc:ISRC1&type=track&market=BR`);
      searchReq1.flush(mockSearchResponse1);

      const trackReq1 = httpMock.expectOne(`https://api.spotify.com/v1/tracks/track1?market=BR`);
      trackReq1.flush(mockTrackResponse1);

      tick(100);

      const searchReq2 = httpMock.expectOne(`https://api.spotify.com/v1/search?q=isrc:ISRC2&type=track&market=BR`);
      searchReq2.flush(mockSearchResponse2);

      const trackReq2 = httpMock.expectOne(`https://api.spotify.com/v1/tracks/track2?market=BR`);
      trackReq2.flush(mockTrackResponse2);

      tick();

      expect(result).toEqual([mockTrackResponse1, mockTrackResponse2]);
    }));

    it('should filter out null results', fakeAsync(() => {
      const mockIsrcs = ['VALID_ISRC', 'INVALID_ISRC'];
      const mockSearchResponse1 = { tracks: { items: [{ id: 'track1' }] } };
      const mockSearchResponse2 = { tracks: { items: [] } };
      const mockTrackResponse1 = { id: 'track1', name: 'Track 1' };

      let result: any;
      service.getTracksByIsrcs(mockIsrcs).subscribe(res => {
        result = res;
      });

      tick(100);

      const searchReq1 = httpMock.expectOne(`https://api.spotify.com/v1/search?q=isrc:VALID_ISRC&type=track&market=BR`);
      searchReq1.flush(mockSearchResponse1);

      const trackReq1 = httpMock.expectOne(`https://api.spotify.com/v1/tracks/track1?market=BR`);
      trackReq1.flush(mockTrackResponse1);

      tick(100);

      const searchReq2 = httpMock.expectOne(`https://api.spotify.com/v1/search?q=isrc:INVALID_ISRC&type=track&market=BR`);
      searchReq2.flush(mockSearchResponse2);

      tick();

      expect(result).toEqual([mockTrackResponse1]);
      expect(result.length).toBe(1);
    }));

    it('should handle mixed success and errors in batch requests', fakeAsync(() => {
      const mockIsrcs = ['SUCCESS_ISRC', 'ERROR_ISRC'];
      const mockSearchResponse1 = { tracks: { items: [{ id: 'track1' }] } };
      const mockSearchResponse2 = { tracks: { items: [{ id: 'track2' }] } };
      const mockTrackResponse1 = { id: 'track1', name: 'Track 1' };

      let result: any;
      service.getTracksByIsrcs(mockIsrcs).subscribe(res => {
        result = res;
      });

      tick(100);

      // Primeira requisição: sucesso
      const searchReq1 = httpMock.expectOne(`https://api.spotify.com/v1/search?q=isrc:SUCCESS_ISRC&type=track&market=BR`);
      searchReq1.flush(mockSearchResponse1);

      const trackReq1 = httpMock.expectOne(`https://api.spotify.com/v1/tracks/track1?market=BR`);
      trackReq1.flush(mockTrackResponse1);

      tick(100);

      // Segunda requisição: search com sucesso, mas getTrackById com erro
      const searchReq2 = httpMock.expectOne(`https://api.spotify.com/v1/search?q=isrc:ERROR_ISRC&type=track&market=BR`);
      searchReq2.flush(mockSearchResponse2);

      const trackReq2 = httpMock.expectOne(`https://api.spotify.com/v1/tracks/track2?market=BR`);
      trackReq2.error(new ErrorEvent('Track error'));

      tick();

      // Deve retornar apenas o track que deu sucesso
      expect(result).toEqual([mockTrackResponse1]);
      expect(result.length).toBe(1);
    }));
  });

  describe('extractTrackIdFromSearchResponse', () => {
    it('should return track ID when items exist', () => {
      const mockResponse = {
        tracks: {
          items: [{ id: 'track123' }]
        }
      };
      
      const result = (service as any).extractTrackIdFromSearchResponse(mockResponse, 'TEST_ISRC');
      expect(result).toBe('track123');
    });

    it('should return null when no items found', () => {
      const mockResponse = {
        tracks: {
          items: []
        }
      };
      
      const result = (service as any).extractTrackIdFromSearchResponse(mockResponse, 'TEST_ISRC');
      expect(result).toBeNull();
    });

    it('should return null when track ID is missing', () => {
      const mockResponse = {
        tracks: {
          items: [{}]
        }
      };
      
      const result = (service as any).extractTrackIdFromSearchResponse(mockResponse, 'TEST_ISRC');
      expect(result).toBeNull();
    });
  });
});