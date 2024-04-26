import { ComponentFixture, TestBed } from '@angular/core/testing';

import { registerLocaleData } from '@angular/common';
import portuguese from '@angular/common/locales/pt';
import { ActivatedRoute, Router } from '@angular/router';
import { spotifyTracksMockArray } from '../../helpers/format-track/track-mock';
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
            snapshot: { params: { isrc: () => 'BRC310600002' } },
          },
        },
        {
          provide: Router,
          useValue: {
            getCurrentNavigation: () => ({
              extras: {
                state: {
                  tracks: spotifyTracksMockArray,
                },
              },
            }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TrackInfoComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
