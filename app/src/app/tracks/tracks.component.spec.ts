import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TracksComponent } from './tracks.component';
import { SpotifyService } from '../core/services/spotify.service';
import { of } from 'rxjs';
import { TrackCardComponent } from './track-card.component';
import { Track } from './track.model';
import { HttpClientTestingModule } from '@angular/common/http/testing'; // ✅

describe('TracksComponent', () => {
  let component: TracksComponent;
  let fixture: ComponentFixture<TracksComponent>;

  const mockTracks: Track[] = [
    {
      title: 'Test Track',
      artists: ['Test Artist'],
      albumImage: 'url',
      releaseDate: '2022-01-01',
      durationMs: 180000,
      previewUrl: null,
      externalUrl: 'https://spotify.com',
      availableInBrazil: true,
      notFound: false,
    },
  ];

  const spotifyServiceMock = {
    fetchTracksByISRCList: jasmine.createSpy('fetchTracksByISRCList').and.returnValue(of(mockTracks)),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TracksComponent, TrackCardComponent, HttpClientTestingModule], // ✅ IMPORTADO AQUI
      providers: [{ provide: SpotifyService, useValue: spotifyServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(TracksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load tracks from SpotifyService', () => {
    expect(component.tracks.length).toBe(1);
    expect(component.tracks[0].title).toBe('Test Track');
  });
});
