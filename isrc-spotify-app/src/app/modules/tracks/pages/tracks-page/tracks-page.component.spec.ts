import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, BehaviorSubject } from 'rxjs';

import { TracksPageComponent } from './tracks-page.component';
import { TracksService } from '../../services/tracks.service';
import { TrackCardComponent } from '../../components/track-card/track-card.component';
import { LayoutComponent } from '../../../../components/layout/layout.component';
import { ITrack } from '../../models';
import { ISRCCodes } from '../../../../core';

class MockTracksService {
  private dataSubject = new BehaviorSubject<ITrack[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  data$ = this.dataSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();
  error$ = this.errorSubject.asObservable();

  loadAllTracks = jasmine.createSpy('loadAllTracks').and.returnValue(of([]));
  reloadTracks = jasmine.createSpy('reloadTracks').and.returnValue(of([]));
  clearError = jasmine.createSpy('clearError');

  setData(data: ITrack[]) {
    this.dataSubject.next(data);
  }

  setLoading(loading: boolean) {
    this.loadingSubject.next(loading);
  }

  setError(error: string | null) {
    this.errorSubject.next(error);
  }
}

describe('TracksPageComponent', () => {
  let component: TracksPageComponent;
  let fixture: ComponentFixture<TracksPageComponent>;
  let mockTracksService: MockTracksService;

  const mockTracks: ITrack[] = [
    {
      id: 'track-1',
      name: 'Alpha Song',
      artists: [
        {
          id: 'artist-1',
          name: 'Artist 1',
          external_urls: {
            spotify: '',
          },
        },
      ],
      album: {
        id: 'album-1',
        name: 'Album 1',
        images: [],
        release_date: '2023-01-01',
        release_date_precision: 'day',
        external_urls: {
          spotify: '',
        },
      },
      duration_ms: 180000,
      preview_url: 'https://example.com/preview1.mp3',
      external_urls: { spotify: 'https://spotify.com/track/1' },
      available_markets: ['US', 'BR'],
      isrc: 'USUM71703861',
    },
    {
      id: 'track-2',
      name: 'Beta Song',
      artists: [
        {
          id: 'artist-2',
          name: 'Artist 2',
          external_urls: {
            spotify: '',
          },
        },
      ],
      album: {
        id: 'album-2',
        name: 'Album 2',
        images: [],
        release_date: '2023-02-01',
        release_date_precision: 'day',
        external_urls: {
          spotify: '',
        },
      },
      duration_ms: 210000,
      preview_url: 'https://example.com/preview2.mp3',
      external_urls: { spotify: 'https://spotify.com/track/2' },
      available_markets: ['US', 'CA'],
      isrc: 'GBUM71505078',
    },
    {
      id: 'track-3',
      name: 'Charlie Song',
      artists: [
        {
          id: 'artist-3',
          name: 'Artist 3',
          external_urls: {
            spotify: '',
          },
        },
      ],
      album: {
        id: 'album-3',
        name: 'Album 3',
        images: [],
        release_date: '2023-03-01',
        release_date_precision: 'day',
        external_urls: {
          spotify: '',
        },
      },
      duration_ms: 195000,
      preview_url: null,
      external_urls: { spotify: 'https://spotify.com/track/3' },
      available_markets: ['BR', 'AR'],
      isrc: 'USRC17607839',
    },
  ];

  beforeEach(async () => {
    mockTracksService = new MockTracksService();

    await TestBed.configureTestingModule({
      imports: [
        TracksPageComponent,
        CommonModule,
        NgxSkeletonLoaderModule,
        TrackCardComponent,
        LayoutComponent,
        HttpClientTestingModule,
      ],
      providers: [{ provide: TracksService, useValue: mockTracksService }],
    }).compileComponents();

    fixture = TestBed.createComponent(TracksPageComponent);
    component = fixture.componentInstance;
  });

  describe('Inicialização', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should load tracks on init', () => {
      fixture.detectChanges();

      expect(mockTracksService.loadAllTracks).toHaveBeenCalled();
    });

    it('should initialize with correct observables', () => {
      expect(component.tracks$).toBe(mockTracksService.data$);
      expect(component.loading$).toBe(mockTracksService.loading$);
      expect(component.error$).toBe(mockTracksService.error$);
    });

    it('should initialize with all ISRC codes', () => {
      expect(component.allISRCs).toEqual(Object.values(ISRCCodes));
      expect(component.allISRCs.length).toBeGreaterThan(0);
    });
  });

  describe('Track management', () => {
    it('should reload tracks when reloadTracks is called', () => {
      component.reloadTracks();

      expect(mockTracksService.reloadTracks).toHaveBeenCalled();
    });

    it('should clear error when clearError is called', () => {
      component.clearError();

      expect(mockTracksService.clearError).toHaveBeenCalled();
    });
  });

  describe('Track tracking', () => {
    it('should track tracks by ISRC', () => {
      const track = mockTracks[0];
      const result = component.trackByISRC(0, track);

      expect(result).toBe(track.isrc);
    });

    it('should return unique ISRC for each track', () => {
      const results = mockTracks.map((track, index) => component.trackByISRC(index, track));

      const uniqueResults = new Set(results);
      expect(uniqueResults.size).toBe(results.length);
    });
  });

  describe('Not found ISRCs', () => {
    it('should return empty array when all ISRCs are found', () => {
      const allISRCTracks = Object.values(ISRCCodes).map((isrc, index) => ({
        ...mockTracks[0],
        id: `track-${index}`,
        isrc,
      }));

      const notFound = component.getNotFoundISRCs(allISRCTracks);

      expect(notFound).toEqual([]);
    });

    it('should return missing ISRCs when some tracks are not found', () => {
      const partialTracks = [mockTracks[0]];
      const notFound = component.getNotFoundISRCs(partialTracks);

      expect(notFound.length).toBeGreaterThan(0);
      expect(notFound).not.toContain(mockTracks[0].isrc);
    });

    it('should return all ISRCs when no tracks are found', () => {
      const notFound = component.getNotFoundISRCs([]);

      expect(notFound).toEqual(Object.values(ISRCCodes));
    });

    it('should handle duplicate ISRCs correctly', () => {
      const tracksWithDuplicates = [mockTracks[0], { ...mockTracks[0], id: 'track-duplicate' }];

      const notFound = component.getNotFoundISRCs(tracksWithDuplicates);

      expect(notFound).not.toContain(mockTracks[0].isrc);
    });
  });

  describe('Track sorting', () => {
    it('should sort tracks alphabetically by name', () => {
      const unsortedTracks = [mockTracks[1], mockTracks[2], mockTracks[0]];
      const sorted = component.getSortedTracks(unsortedTracks);

      expect(sorted[0].name).toBe('Alpha Song');
      expect(sorted[1].name).toBe('Beta Song');
      expect(sorted[2].name).toBe('Charlie Song');
    });

    it('should not modify the original array', () => {
      const originalTracks = [...mockTracks];
      const sorted = component.getSortedTracks(mockTracks);

      expect(mockTracks).toEqual(originalTracks);
      expect(sorted).not.toBe(mockTracks);
    });

    it('should handle empty array', () => {
      const sorted = component.getSortedTracks([]);

      expect(sorted).toEqual([]);
    });

    it('should handle single track', () => {
      const singleTrack = [mockTracks[0]];
      const sorted = component.getSortedTracks(singleTrack);

      expect(sorted).toEqual(singleTrack);
    });

    it('should handle tracks with same name', () => {
      const tracksWithSameName = [mockTracks[0], { ...mockTracks[0], id: 'track-same-name' }];

      const sorted = component.getSortedTracks(tracksWithSameName);

      expect(sorted.length).toBe(2);
      expect(sorted[0].name).toBe(sorted[1].name);
    });

    it('should handle case-insensitive sorting', () => {
      const mixedCaseTracks = [
        { ...mockTracks[0], name: 'zebra song' },
        { ...mockTracks[1], name: 'Alpha song' },
        { ...mockTracks[2], name: 'Beta Song' },
      ];

      const sorted = component.getSortedTracks(mixedCaseTracks);

      expect(sorted[0].name).toBe('Alpha song');
      expect(sorted[1].name).toBe('Beta Song');
      expect(sorted[2].name).toBe('zebra song');
    });
  });

  describe('Data flow', () => {
    it('should react to loading state changes', () => {
      let loadingState: boolean | undefined;

      component.loading$.subscribe((loading) => {
        loadingState = loading;
      });

      mockTracksService.setLoading(true);
      expect(loadingState).toBe(true);

      mockTracksService.setLoading(false);
      expect(loadingState).toBe(false);
    });

    it('should react to data changes', () => {
      let tracksData: ITrack[] | undefined;

      component.tracks$.subscribe((tracks) => {
        tracksData = tracks;
      });

      mockTracksService.setData(mockTracks);
      expect(tracksData).toEqual(mockTracks);

      mockTracksService.setData([]);
      expect(tracksData).toEqual([]);
    });

    it('should react to error state changes', () => {
      let errorState: string | null | undefined;

      component.error$.subscribe((error) => {
        errorState = error;
      });

      mockTracksService.setError('Test error');
      expect(errorState).toBe('Test error');

      mockTracksService.setError(null);
      expect(errorState).toBeNull();
    });
  });

  describe('Error handling', () => {
    it('should handle service errors gracefully', () => {
      mockTracksService.loadAllTracks.and.returnValue(of([]));

      expect(() => component.reloadTracks()).not.toThrow();
    });

    it('should clear errors when requested', () => {
      mockTracksService.setError('Some error');

      component.clearError();

      expect(mockTracksService.clearError).toHaveBeenCalled();
    });
  });

  describe('Performance considerations', () => {
    it('should use trackBy function for efficient rendering', () => {
      const trackByFn = component.trackByISRC;

      expect(typeof trackByFn).toBe('function');

      const track = mockTracks[0];
      const result1 = trackByFn(0, track);
      const result2 = trackByFn(0, track);

      expect(result1).toBe(result2);
    });

    it('should not recreate sorted array unnecessarily', () => {
      const tracks = mockTracks;
      const sorted1 = component.getSortedTracks(tracks);
      const sorted2 = component.getSortedTracks(tracks);

      expect(sorted1).toEqual(sorted2);
      expect(sorted1).not.toBe(sorted2);
    });
  });

  describe('Edge cases', () => {
    it('should handle undefined tracks array', () => {
      expect(() => component.getSortedTracks(undefined as any)).toThrow();
    });

    it('should handle tracks with undefined names', () => {
      const tracksWithUndefinedName = [{ ...mockTracks[0], name: undefined as any }, mockTracks[1]];

      expect(() => component.getSortedTracks(tracksWithUndefinedName)).not.toThrow();
    });

    it('should handle tracks with null ISRC', () => {
      const trackWithNullISRC = { ...mockTracks[0], isrc: null as any };

      expect(() => component.trackByISRC(0, trackWithNullISRC)).not.toThrow();
    });

    it('should handle empty ISRC codes list', () => {
      const originalAllISRCs = component.allISRCs;
      (component as any).allISRCs = [];

      const notFound = component.getNotFoundISRCs(mockTracks);
      expect(notFound).toEqual([]);

      (component as any).allISRCs = originalAllISRCs;
    });
  });

  describe('Component lifecycle', () => {
    it('should call loadAllTracks on ngOnInit', () => {
      mockTracksService.loadAllTracks.calls.reset();

      component.ngOnInit();

      expect(mockTracksService.loadAllTracks).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple init calls gracefully', () => {
      component.ngOnInit();
      component.ngOnInit();

      expect(mockTracksService.loadAllTracks).toHaveBeenCalledTimes(2);
    });
  });
});
