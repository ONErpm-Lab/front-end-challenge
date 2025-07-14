import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PageEvent } from '@angular/material/paginator';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { NotificationService } from '../../services/notification/notification.service';
import { SpotfyService } from '../../services/spotfy/spotfy.service';
import { TokenService } from '../../services/token/token.service';
import { ListComponent } from './list.component';

describe('ListComponent', () => {
  let component: ListComponent;
  let fixture: ComponentFixture<ListComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockTokenService: jasmine.SpyObj<TokenService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockSpotfyService: jasmine.SpyObj<SpotfyService>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;
  let notificationSubject: Subject<boolean>;

  const mockTracks = [
    {
      id: '1',
      name: 'Track 1',
      preview_url: 'http://example.com/preview1.mp3',
      duration_ms: 180000,
      artists: [{ name: 'Artist 1' }],
      external_urls: { spotify: 'http://spotify.com/track1' },
      album: {
        name: 'Album 1',
        images: [
          { url: 'http://example.com/image1.jpg', height: 640, width: 640 },
          { url: 'http://example.com/image1_small.jpg', height: 300, width: 300 }
        ]
      }
    },
    {
      id: '2',
      name: 'Track 2',
      preview_url: null,
      duration_ms: 200000,
      artists: [{ name: 'Artist 2' }],
      external_urls: { spotify: 'http://spotify.com/track2' },
      album: {
        name: 'Album 2',
        images: [
          { url: 'http://example.com/image2.jpg', height: 640, width: 640 }
        ]
      }
    }
  ];

  beforeEach(async () => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const tokenServiceSpy = jasmine.createSpyObj('TokenService', ['getAccessToken']);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['saveToken']);
    const spotfyServiceSpy = jasmine.createSpyObj('SpotfyService', ['getTracksByIsrcs']);
    const notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['getNotification']);

    notificationSubject = new Subject<boolean>();

    await TestBed.configureTestingModule({
      imports: [ListComponent, NoopAnimationsModule],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: TokenService, useValue: tokenServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: SpotfyService, useValue: spotfyServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy }
      ]
    }).compileComponents();

    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockTokenService = TestBed.inject(TokenService) as jasmine.SpyObj<TokenService>;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockSpotfyService = TestBed.inject(SpotfyService) as jasmine.SpyObj<SpotfyService>;
    mockNotificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;

    // Configurar mocks padrão
    mockTokenService.getAccessToken.and.returnValue(of({ access_token: 'mock-token' }));
    mockSpotfyService.getTracksByIsrcs.and.returnValue(of(mockTracks));
    mockNotificationService.getNotification.and.returnValue(notificationSubject);

    fixture = TestBed.createComponent(ListComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    // Limpar recursos
    if (component.currentAudio) {
      try {
        component.currentAudio.pause();
      } catch (e) {}
      component.currentAudio = null;
    }
    component.currentPlayingId = null;
    
    if (notificationSubject && !notificationSubject.closed) {
      notificationSubject.complete();
    }
    
    if (fixture) {
      fixture.destroy();
    }
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.tracks).toEqual([]);
    expect(component.paginateData).toEqual([]);
    expect(component.totalItems).toBe(0);
    expect(component.pageSize).toBe(10);
    expect(component.pageIndex).toBe(0);
    expect(component.currentPlayingId).toBeNull();
    expect(component.currentAudio).toBeNull();
    expect(component.activePaginator).toBeFalsy();
    expect(component.isrcs.length).toBe(10);
  });

  it('should initialize tracks on ngOnInit', () => {
    fixture.detectChanges();
    
    expect(mockTokenService.getAccessToken).toHaveBeenCalled();
    expect(mockSpotfyService.getTracksByIsrcs).toHaveBeenCalled();
    expect(component.tracks).toEqual(mockTracks);
  });

  it('should handle page change', () => {
    const event: PageEvent = { pageIndex: 1, pageSize: 5, length: 10 };
    component.tracks = mockTracks;
    
    component.onPageChange(event);
    
    expect(component.pageIndex).toBe(1);
    expect(component.pageSize).toBe(5);
  });

  it('should update paginated data correctly', () => {
    component.tracks = mockTracks;
    component.pageIndex = 0;
    component.pageSize = 1;
    
    component.updatePaginatedData();
    
    expect(component.paginateData.length).toBe(1);
    expect(component.paginateData[0]).toEqual(mockTracks[0]);
  });

  it('should navigate to details', () => {
    const trackId = '123';
    
    component.navigateDetails(trackId);
    
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/details', trackId]);
  });

  it('should play audio when track has preview_url', () => {
    const mockAudio = {
      play: jasmine.createSpy('play').and.returnValue(Promise.resolve()),
      addEventListener: jasmine.createSpy('addEventListener'),
      pause: jasmine.createSpy('pause')
    };
    spyOn(window, 'Audio').and.returnValue(mockAudio as any);
    
    component.playAudio(mockTracks[0]);
    
    expect(component.currentPlayingId).toBe('1');
    expect(window.Audio).toHaveBeenCalledWith('http://example.com/preview1.mp3');
    expect(mockAudio.play).toHaveBeenCalled();
  });

  it('should handle audio play error', async () => {
    const mockAudio = {
      play: jasmine.createSpy('play').and.returnValue(Promise.reject(new Error('Play failed'))),
      addEventListener: jasmine.createSpy('addEventListener'),
      pause: jasmine.createSpy('pause')
    };
    spyOn(window, 'Audio').and.returnValue(mockAudio as any);
    spyOn(console, 'error');
    spyOn(component, 'onAudioError');
    
    component.playAudio(mockTracks[0]);
    
    // Aguardar a promise ser rejeitada
    await expectAsync(mockAudio.play()).toBeRejected();
    
    expect(console.error).toHaveBeenCalledWith('Erro ao reproduzir áudio:', jasmine.any(Error));
    expect(component.onAudioError).toHaveBeenCalledWith('1');
  });

  it('should pause audio', () => {
    const mockAudio = {
      pause: jasmine.createSpy('pause'),
      addEventListener: jasmine.createSpy('addEventListener')
    } as any;
    component.currentAudio = mockAudio;
    component.currentPlayingId = '1';
    
    component.pauseAudio();
    
    expect(mockAudio.pause).toHaveBeenCalled();
    expect(component.currentAudio).toBeNull();
    expect(component.currentPlayingId).toBeNull();
  });

  it('should check if track is playing', () => {
    component.currentPlayingId = null;
    component.currentAudio = null;
    
    expect(component.isPlaying('1')).toBeFalsy();
    
    component.currentPlayingId = '1';
    component.currentAudio = { paused: false } as any;
    expect(component.isPlaying('1')).toBeTruthy();
    expect(component.isPlaying('2')).toBeFalsy();
    
    component.currentAudio = { paused: true } as any;
    expect(component.isPlaying('1')).toBeFalsy();
  });

  it('should format duration correctly', () => {
    expect(component.formatDuration(180000)).toBe('3:00');
    expect(component.formatDuration(60000)).toBe('1:00');
    expect(component.formatDuration(125000)).toBe('2:05');
    expect(component.formatDuration(3661000)).toBe('61:01');
    expect(component.formatDuration(0)).toBe('0:00');
  });

  it('should get artists names', () => {
    const artists = [{ name: 'Artist 1' }, { name: 'Artist 2' }];
    const result = component.getArtistsNames(artists);
    expect(result).toBe('Artist 1, Artist 2');
  });

  it('should check if track has valid preview', () => {
    spyOn(console, 'log');
    
    expect(component.hasValidPreview(mockTracks[0])).toBeTruthy();
    expect(component.hasValidPreview(mockTracks[1])).toBeFalsy();
    expect(component.hasValidPreview(null)).toBeFalsy();
    expect(component.hasValidPreview({ preview_url: '' })).toBeFalsy();
    expect(component.hasValidPreview({ preview_url: null })).toBeFalsy();
    expect(component.hasValidPreview({ preview_url: 'http://valid.url' })).toBeTruthy();
    
    expect(console.log).toHaveBeenCalled();
  });

  it('should open Spotify external link', () => {
    spyOn(window, 'open');
    
    component.openSpotify(mockTracks[0]);
    
    expect(window.open).toHaveBeenCalledWith('http://spotify.com/track1', '_blank');
  });

 it('should handle tracks without external urls', () => {
  const trackWithoutSpotify = { ...mockTracks[0], external_urls: undefined };
  spyOn(window, 'open');
  
  component.openSpotify(trackWithoutSpotify);
  
  expect(window.open).not.toHaveBeenCalled();
});

  it('should handle notification events', () => {
    component.listeningNotificationEvent();
    
    notificationSubject.next(true);
    
    expect(component.activePaginator).toBeTruthy();
  });

  it('should handle false notification events', () => {
    component.tracks = mockTracks;
    component.listeningNotificationEvent();
    
    notificationSubject.next(false);
    
    expect(component.activePaginator).toBeFalsy();
    expect(component.pageSize).toBe(mockTracks.length);
  });

  it('should handle error when getting tracks', () => {
    mockSpotfyService.getTracksByIsrcs.and.returnValue(throwError(() => new Error('API Error')));
    spyOn(console, 'error');
    
    component.ngOnInit();
    
    expect(console.error).toHaveBeenCalledWith('>>>>>>>>>>> Erro ao buscar faixas:', jasmine.any(Error));
  });

  it('should clean up audio on destroy', () => {
    const mockAudio = { 
      pause: jasmine.createSpy('pause'),
      addEventListener: jasmine.createSpy('addEventListener')
    } as any;
    component.currentAudio = mockAudio;
    
    component.ngOnDestroy();
    
    expect(mockAudio.pause).toHaveBeenCalled();
  });

  it('should handle audio ended event', () => {
    const mockAudio = {
      play: jasmine.createSpy('play').and.returnValue(Promise.resolve()),
      addEventListener: jasmine.createSpy('addEventListener'),
      pause: jasmine.createSpy('pause')
    };
    spyOn(window, 'Audio').and.returnValue(mockAudio as any);
    
    component.playAudio(mockTracks[0]);
    
    expect(mockAudio.addEventListener).toHaveBeenCalledWith('ended', jasmine.any(Function));
  });

it('should handle token service returning access_token', () => {
  const mockToken = 'test-token';
  mockTokenService.getAccessToken.and.returnValue(of(mockToken));
  mockAuthService.saveToken.calls.reset();
  
  component.ngOnInit();
  
  expect(mockAuthService.saveToken).toHaveBeenCalledWith('test-token');
});

  it('should handle tracks with empty album images', () => {
    const tracksWithEmptyImages = [
      {
        ...mockTracks[0],
        album: {
          name: 'Album Test',
          images: []
        }
      }
    ];
    
    mockSpotfyService.getTracksByIsrcs.and.returnValue(of(tracksWithEmptyImages));
    
    const newFixture = TestBed.createComponent(ListComponent);
    const newComponent = newFixture.componentInstance;
    
    newFixture.detectChanges();
    
    expect(newComponent.tracks).toEqual(tracksWithEmptyImages);
    newFixture.destroy();
  });

  it('should handle empty tracks array', () => {
    mockSpotfyService.getTracksByIsrcs.and.returnValue(of([]));
    
    const newFixture = TestBed.createComponent(ListComponent);
    const newComponent = newFixture.componentInstance;
    
    newFixture.detectChanges();
    
    expect(newComponent.tracks).toEqual([]);
    expect(newComponent.paginateData).toEqual([]);
    
    newFixture.destroy();
  });

  it('should calculate pagination correctly', () => {
    component.tracks = mockTracks;
    component.pageIndex = 1;
    component.pageSize = 1;
    
    component.updatePaginatedData();
    
    expect(component.paginateData.length).toBe(1);
    expect(component.paginateData[0]).toEqual(mockTracks[1]);
  });

  it('should toggle audio between play and pause', () => {
    const mockAudio = {
      play: jasmine.createSpy('play').and.returnValue(Promise.resolve()),
      addEventListener: jasmine.createSpy('addEventListener'),
      pause: jasmine.createSpy('pause')
    };
    spyOn(window, 'Audio').and.returnValue(mockAudio as any);
    
    component.toggleAudio(mockTracks[0]);
    expect(component.currentPlayingId).toBe('1');
    
    component.toggleAudio(mockTracks[0]);
    expect(component.currentPlayingId).toBeNull();
  });

  it('should handle audio error', () => {
    spyOn(console, 'error');
    component.currentPlayingId = '1';
    
    component.onAudioError('1');
    
    expect(console.error).toHaveBeenCalledWith('Erro ao carregar áudio para:', '1');
    expect(component.currentPlayingId).toBeNull();
    expect(component.currentAudio).toBeNull();
  });

  it('should handle audio load start', () => {
    spyOn(console, 'log');
    
    component.onAudioLoadStart('1');
    
    expect(console.log).toHaveBeenCalledWith('Carregando áudio para:', '1');
  });

  it('should handle onPageChange with lastPagination update', () => {
    const event: PageEvent = { pageIndex: 2, pageSize: 15, length: 50 };
    component.tracks = mockTracks;
    spyOn(component, 'updatePaginatedData');
    
    component.onPageChange(event);
    
    expect((component as any).lastPagination).toBe(15);
    expect(component.pageIndex).toBe(2);
    expect(component.pageSize).toBe(15);
    expect(component.updatePaginatedData).toHaveBeenCalled();
  });

  it('should handle notification true event with lastPaginationIsCall', () => {
    (component as any).lastPagination = 8;
    spyOn(component, 'updatePaginatedData');
    component.listeningNotificationEvent();
    
    notificationSubject.next(true);
    
    expect(component.activePaginator).toBeTruthy();
    expect(component.pageSize).toBe(8);
    expect(component.updatePaginatedData).toHaveBeenCalled();
  });

  it('should handle notification true event with default pagination', () => {
    (component as any).lastPagination = 0;
    spyOn(component, 'updatePaginatedData');
    component.listeningNotificationEvent();
    
    notificationSubject.next(true);
    
    expect(component.activePaginator).toBeTruthy();
    expect(component.pageSize).toBe(5);
    expect((component as any).lastPagination).toBe(5);
    expect(component.updatePaginatedData).toHaveBeenCalled();
  });

  it('should handle track without preview url when playing', () => {
    const trackWithoutPreview = { ...mockTracks[1], preview_url: null };
    
    component.playAudio(trackWithoutPreview);
    
    expect(component.currentPlayingId).toBeNull();
    expect(component.currentAudio).toBeNull();
  });

  it('should call getTracks during ngOnInit', () => {
    spyOn(component as any, 'getTracks');
    spyOn(component, 'listeningNotificationEvent');
    
    component.ngOnInit();
    
    expect((component as any).getTracks).toHaveBeenCalled();
    expect(component.listeningNotificationEvent).toHaveBeenCalled();
  });

  it('should update total items when tracks are loaded', () => {
    component.tracks = [];
    component.totalItems = 0;
    
    component.ngOnInit();
    
    expect(component.totalItems).toBe(mockTracks.length);
  });

  it('should filter missing isrcs correctly', () => {
    const partialTracks = [mockTracks[0]];
    mockSpotfyService.getTracksByIsrcs.and.returnValue(of(partialTracks));
    
    component.ngOnInit();
    
    expect(component.missingIsrcs.length).toBeGreaterThan(0);
  });

  it('should handle audio ended callback', () => {
    const mockAudio = {
      play: jasmine.createSpy('play').and.returnValue(Promise.resolve()),
      addEventListener: jasmine.createSpy('addEventListener'),
      pause: jasmine.createSpy('pause')
    };
    spyOn(window, 'Audio').and.returnValue(mockAudio as any);
    
    component.playAudio(mockTracks[0]);
    
    const endedCallback = mockAudio.addEventListener.calls.argsFor(0)[1];
    endedCallback();
    
    expect(component.currentPlayingId).toBeNull();
    expect(component.currentAudio).toBeNull();
  });

  it('should handle onAudioEnded correctly', () => {
    component.currentPlayingId = '1';
    component.currentAudio = {} as HTMLAudioElement;
    
    component.onAudioEnded('1');
    
    expect(component.currentPlayingId).toBeNull();
    expect(component.currentAudio).toBeNull();
  });

  it('should not change state for different track on onAudioEnded', () => {
    component.currentPlayingId = '1';
    component.currentAudio = {} as HTMLAudioElement;
    
    component.onAudioEnded('2');
    
    expect(component.currentPlayingId).toBe('1');
    expect(component.currentAudio).not.toBeNull();
  });

  it('should handle pause when no audio is playing', () => {
    component.currentAudio = null;
    component.currentPlayingId = null;
    
    expect(() => component.pauseAudio()).not.toThrow();
    expect(component.currentAudio).toBeNull();
    expect(component.currentPlayingId).toBeNull();
  });

  it('should handle private lastPaginationIsCall method', () => {
    spyOn(component, 'updatePaginatedData');
    (component as any).lastPagination = 0;
    
    (component as any).lastPaginationIsCall();
    
    expect(component.pageSize).toBe(5);
    expect((component as any).lastPagination).toBe(5);
    expect(component.updatePaginatedData).toHaveBeenCalled();
  });

  it('should handle private lastPaginationIsCall with existing pagination', () => {
    spyOn(component, 'updatePaginatedData');
    (component as any).lastPagination = 10;
    
    (component as any).lastPaginationIsCall();
    
    expect(component.pageSize).toBe(10);
    expect(component.updatePaginatedData).toHaveBeenCalled();
  });

  it('should handle getTracks with successful response', () => {
    const testTracks = [...mockTracks];
    mockSpotfyService.getTracksByIsrcs.and.returnValue(of(testTracks));
    spyOn(component, 'updatePaginatedData');
    
    (component as any).getTracks();
    
    expect(component.tracks).toEqual(testTracks);
    expect(component.totalItems).toBe(testTracks.length);
    expect(component.updatePaginatedData).toHaveBeenCalled();
  });

  it('should handle notification service subscription', () => {
    spyOn(console, 'log');
    component.listeningNotificationEvent();
    
    notificationSubject.next(true);
    
    expect(console.log).toHaveBeenCalledWith('Notification received, updating track list...', true);
  });

  it('should initialize urlImage with environment value', () => {
    expect(component.urlImage).toBeDefined();
  });

  it('should handle empty artists array', () => {
    const result = component.getArtistsNames([]);
    expect(result).toBe('');
  });

  it('should handle single artist', () => {
    const artists = [{ name: 'Single Artist' }];
    const result = component.getArtistsNames(artists);
    expect(result).toBe('Single Artist');
  });

  it('should handle toggleAudio with track without preview', () => {
    component.toggleAudio(mockTracks[1]);
    
    expect(component.currentPlayingId).toBeNull();
    expect(component.currentAudio).toBeNull();
  });

  it('should handle openSpotify with track without spotify url', () => {
    const trackWithoutSpotify = {
      ...mockTracks[0],
      external_urls: {}
    };
    spyOn(window, 'open');
    
    component.openSpotify(trackWithoutSpotify);
    
    expect(window.open).not.toHaveBeenCalled();
  });

  it('should handle pagination with tracks length less than pageSize', () => {
    component.tracks = mockTracks;
    component.pageIndex = 0;
    component.pageSize = 10;
    
    component.updatePaginatedData();
    
    expect(component.paginateData.length).toBe(2);
    expect(component.paginateData).toEqual(mockTracks);
  });
});