import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { of } from 'rxjs';
import isrcList from '../../data/isrc-list.data';
import { SpotifyService } from '../../services/spotify.service';
import {
  isrcMock,
  spotifySearchContentMock,
} from '../../tests/mocks/track-mock';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let spotifyServiceSpy: jasmine.SpyObj<SpotifyService>;

  beforeEach(async () => {
    spotifyServiceSpy = jasmine.createSpyObj('SpotifyService', ['getTrack']);
    spotifyServiceSpy.getTrack.and.returnValue(of(spotifySearchContentMock));

    await TestBed.configureTestingModule({
      imports: [
        HomeComponent,
        HttpClientTestingModule,
        BrowserAnimationsModule,
        RouterModule,
      ],
      providers: [
        Router,
        {
          provide: ActivatedRoute,
          useValue: {},
        },
        { provide: SpotifyService, useValue: spotifyServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should loop [isrcList] and render a isrc number list in the HTML template', () => {
    const isrcListLength = isrcList.length;
    const liItems = fixture.debugElement.queryAll(
      By.css('.home__isrc-list__item')
    );

    expect(liItems.length).toEqual(isrcListLength);
  });

  it('#isrcList should retrieve isrc list when called/accessed', () => {
    const irscMockList = isrcList;
    expect(component['isrcList']).toEqual(irscMockList);
  });

  it('#loadTrackInfo should load the track info from api', () => {
    const mockEvent = new Event('click');
    const spyHandleSearch = spyOn<any>(component, 'handleSearch');

    component['loadTrackInfo'](mockEvent, isrcMock);
    expect(spotifyServiceSpy.getTrack).toHaveBeenCalledWith(isrcMock);
    expect(spyHandleSearch).toHaveBeenCalledWith(
      spotifySearchContentMock,
      isrcMock
    );
  });

  it(`#handleSearch should validate if [searchResult] has a [tracks] property 
  and if its length is grather 0, if not it must set [showModal] as true and do not navigate`, () => {
    const spy = spyOn(component['router'], 'navigate');
    const searchContentWithoutTracks = {};

    component['handleSearch'](searchContentWithoutTracks, isrcMock);
    fixture.detectChanges();

    const modalEl = fixture.debugElement.query(By.css('app-modal'));

    expect(component['showModal'])
      .withContext('Check if [showModal] is true')
      .toBeTrue();

    expect(modalEl)
      .withContext('Check if <app-modal> is present in HTML template.')
      .toBeTruthy();

    expect(spy)
      .withContext('Check if #router have not been called')
      .not.toHaveBeenCalled();
  });

  it(`#handleSearch should extract [items] property from [searchResult.tracks] 
  and navigate to "/track-info/:isrc" passing the [tracks] on the [state] extras.`, () => {
    const spy = spyOn(component['router'], 'navigate');

    component['handleSearch'](spotifySearchContentMock, isrcMock);
    fixture.detectChanges();

    const modalEl = fixture.debugElement.query(By.css('app-modal'));

    expect(component['showModal'])
      .withContext('Check if [showModal] is false')
      .toBeFalse();

    expect(modalEl)
      .withContext('Check if <app-modal> is present in HTML template.')
      .toBeFalsy();

    expect(spy)
      .withContext(
        'Check if router have been called with the right parameters.'
      )
      .toHaveBeenCalledWith(['/track-info', isrcMock], {
        state: { tracks: spotifySearchContentMock.tracks?.items },
      });
  });

  it(`<app-modal> should apear when [showModal] property is set as true`, () => {
    const getAppModalEl = () => fixture.debugElement.query(By.css('app-modal'));

    expect(getAppModalEl()).toBeNull();

    component['showModal'] = true;
    fixture.detectChanges();
    expect(getAppModalEl()).not.toBeNull();
  });
});
