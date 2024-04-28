import { ComponentFixture, TestBed } from '@angular/core/testing';

import { registerLocaleData } from '@angular/common';
import portuguese from '@angular/common/locales/pt';
import { ActivatedRoute, Router } from '@angular/router';
import {
  isrcMock,
  spotifyTracksMockArray,
  trackInfoMockArray,
} from '../../tests/mocks/track-mock';
import { TrackInfoComponent } from './track-info.component';

registerLocaleData(portuguese, 'pt-BR');

describe('TrackInfoComponent', () => {
  let component: TrackInfoComponent;
  let fixture: ComponentFixture<TrackInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrackInfoComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: { isrc: isrcMock } },
          },
        },
      ],
    }).compileComponents();

    const router = TestBed.inject(Router);
    spyOn(router, 'getCurrentNavigation').and.returnValue({
      extras: { state: { tracks: spotifyTracksMockArray } },
    } as any);

    fixture = TestBed.createComponent(TrackInfoComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should transform the router received Spotify Tracks into TrackInfo array', () => {
    const tracks = (component as any)['tracks'];

    expect(tracks).toEqual(trackInfoMockArray);
  });

  it('should get the isrc from the activated route params', () => {
    const isrc = (component as any)['isrc'];
    expect(isrc).toEqual(isrcMock);
  });

  it('#back should navigate to /home', () => {
    const spy = spyOn(component['route'], 'navigate');

    component['back']();

    expect(spy).toHaveBeenCalledWith(['/home']);
  });
});
