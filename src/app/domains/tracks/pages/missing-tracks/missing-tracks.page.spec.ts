import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MissingTracksPage } from './missing-tracks.page';
import { MissingTracksService } from '../../services/missing-tracks.service';
import { of, throwError } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { provideZonelessChangeDetection } from '@angular/core';
import { Subject } from 'rxjs';

@Component({selector: 'app-missing-track-card', template: ''})
class MockMissingTrackCardComponent {}

@Component({selector: 'app-loading-spinner', template: ''})
class MockLoadingSpinnerComponent {}

describe('MissingTracksPage', () => {
  let component: MissingTracksPage;
  let fixture: ComponentFixture<MissingTracksPage>;
  let serviceSpy: jasmine.SpyObj<MissingTracksService>;

  const mockSpotifyResponse = [
    {
      isrc: 'ISRC_MOCK_1',
      track: {
        id: '1',
        name: 'Z - Música Teste',
        album: { images: [{ url: '' }], release_date: '2020-01-01' },
        artists: [{ name: 'Artista Teste' }],
        duration_ms: 180000,
        external_urls: { spotify: '' },
        available_markets: ['BR'],
        preview_url: '',
      }
    },
    {
      isrc: 'ISRC_MOCK_2',
      track: {
        id: '2',
        name: 'A - Música Teste 2',
        album: { images: [{ url: '' }], release_date: '2020-01-01' },
        artists: [{ name: 'Artista Teste 2' }],
        duration_ms: 180000,
        external_urls: { spotify: '' },
        available_markets: ['BR'],
        preview_url: '',
      }
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        MissingTracksPage, 
        MockLoadingSpinnerComponent,
        MockMissingTrackCardComponent
      ],
      providers: [
        { provide: MissingTracksService, useValue: jasmine.createSpyObj('MissingTracksService', ['getMissingTracks']) },
        provideZonelessChangeDetection()
      ]
    }).compileComponents();
    serviceSpy = TestBed.inject(MissingTracksService) as jasmine.SpyObj<MissingTracksService>;
  });

  it('should create the page', () => {
    serviceSpy.getMissingTracks.and.returnValue(of(mockSpotifyResponse));
    fixture = TestBed.createComponent(MissingTracksPage);
    component = fixture.componentInstance;
    fixture.detectChanges();  
    expect(component).toBeTruthy();
  });

  it('should display loading when loading', () => {
    const loadingSubject = new Subject<any>();
    serviceSpy.getMissingTracks.and.returnValue(loadingSubject.asObservable());
    fixture = TestBed.createComponent(MissingTracksPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    const loading = fixture.nativeElement.querySelector('app-loading-spinner');
    expect(loading).toBeTruthy();
  });

  it('should display error when hasError is true', () => {
    serviceSpy.getMissingTracks.and.returnValue(throwError(() => new Error('erro')));
    fixture = TestBed.createComponent(MissingTracksPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    const error = fixture.nativeElement.querySelector('.missing-tracks__error');
    expect(error).toBeTruthy();
  });

  it('should order tracks by name', () => {
    serviceSpy.getMissingTracks.and.returnValue(of(mockSpotifyResponse));
    fixture = TestBed.createComponent(MissingTracksPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    const tracks = component.missingTracks();
    expect(tracks[0].name).toBe('A - Música Teste 2');
    expect(tracks[1].name).toBe('Z - Música Teste');
  });
}); 