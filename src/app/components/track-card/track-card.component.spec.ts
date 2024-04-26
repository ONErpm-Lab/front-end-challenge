import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DatePipe } from '@angular/common';
import { By } from '@angular/platform-browser';
import { trackInfoMock } from '../../tests/mocks/track-mock';
import TrackInfo from '../track-info/track-info.interface';
import { TrackCardComponent } from './track-card.component';

describe(TrackCardComponent.name, () => {
  let component: TrackCardComponent;
  let fixture: ComponentFixture<TrackCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrackCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TrackCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the TrackInfo on the HTML template', () => {
    const track: TrackInfo = trackInfoMock;
    component.track = track;

    fixture.detectChanges();

    const releaseDate = fixture.debugElement.query(By.css('.release-date p'))
      .nativeElement as HTMLParagraphElement;

    const releaseDatePiped =
      new DatePipe('pt-BR').transform(
        track.releaseDate,
        'longDate',
        '',
        'pt-BR'
      ) || '';

    expect(releaseDate.innerText).toEqual(releaseDatePiped);

    const name = fixture.debugElement.query(By.css('.track-name p'))
      .nativeElement as HTMLParagraphElement;
    expect(name.innerText).toEqual(track.name);

    const artists = fixture.debugElement.query(By.css('.track-artists p'))
      .nativeElement as HTMLParagraphElement;
    expect(artists.innerText).toEqual(track.artists);

    const duration = fixture.debugElement.query(By.css('.duration p'))
      .nativeElement as HTMLParagraphElement;
    const durationPiped =
      new DatePipe('pt-BR').transform(track.duration, 'mm:ss', 'pt-BR') || '';
    expect(duration.innerText).toEqual(durationPiped);

    const player = fixture.debugElement.query(By.css('.player audio source'))
      .nativeElement as HTMLSourceElement;
    expect(player.src).toEqual(track.previewUrl);

    const spotifyUrl = fixture.debugElement.query(By.css('.spotify-link a'))
      .nativeElement as HTMLAnchorElement;
    expect(spotifyUrl.href).toEqual(track.spotifyUrl);

    const availableInBR = fixture.debugElement.query(By.css('.avaible-brazil'));
    expect(availableInBR).toBeTruthy();
  });
});
