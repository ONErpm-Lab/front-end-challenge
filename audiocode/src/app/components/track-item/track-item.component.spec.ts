import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackData } from '../../models/track.model';
import { TrackItemComponent } from './track-item.component';

describe('TrackItemComponent', () => {
  let component: TrackItemComponent;
  let fixture: ComponentFixture<TrackItemComponent>;
  const track: TrackData = {
    isrc: 'ABC123',
    albumThumb: 'cover.jpg',
    releaseDate: '2024-03-25',
    title: 'Faixa Teste',
    artists: ['Artista Teste'],
    durationFormated: '02:05',
    previewUrl: null,
    spotifyLink: 'https://spotify.test/track',
    availableInBR: true
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrackItemComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrackItemComponent);
    component = fixture.componentInstance;
    component.track = track;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render track details and availability', () => {
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Faixa Teste');
    expect(text).toContain('Artista Teste');
    expect(text).toContain('25/03/2024');
    expect(text).toContain('ABC123');
    expect(text).toContain('Disponível no BR');
  });
});
