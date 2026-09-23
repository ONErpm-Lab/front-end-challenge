import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TrackData } from '../../models/track.model';
import { SpotifyService } from '../../services/spotify.service';
import { TrackListPageComponent } from './track-list.component';

describe('TrackListComponent', () => {
  let component: TrackListPageComponent;
  let fixture: ComponentFixture<TrackListPageComponent>;
  const track: TrackData = {
    isrc: 'ABC123',
    albumThumb: 'cover.jpg',
    releaseDate: '2024-03-25',
    title: 'Coração Aberto',
    artists: ['Artista Teste'],
    durationFormated: '03:10',
    previewUrl: null,
    spotifyLink: 'https://spotify.test/track',
    availableInBR: true
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrackListPageComponent],
      providers: [{
        provide: SpotifyService,
        useValue: { searchTrackByIsrc: (isrc: string) => of({ ...track, isrc }) }
      }]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrackListPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should select the first sorted track after loading', () => {
    expect(component.selectedTrack?.isrc).toBe(component.isrcs[0]);
  });

  it('should filter tracks by title and artist without accents', () => {
    const anotherTrack = { ...track, isrc: 'DEF456', title: 'Outra Faixa', artists: ['Banda Exemplo'] };

    component.searchTerm = 'coracao';
    expect(component.getFilteredTracks([track, anotherTrack])).toEqual([track]);

    component.searchTerm = 'banda';
    expect(component.getFilteredTracks([track, anotherTrack])).toEqual([anotherTrack]);
  });

  it('should toggle the selected accordion track', () => {
    component.selectedTrack = track;
    component.toggleTrack(track);
    expect(component.selectedTrack).toBeNull();

    component.toggleTrack(track);
    expect(component.selectedTrack).toEqual(track);
  });
});
