import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AppComponent } from './app.component';
import { TokenService } from './core/token/token.service';
import { SpotifyService } from './services/spotify.service';
import { accessTokenMock } from './tests/mocks/access-token.mock';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let spotifyService: jasmine.SpyObj<SpotifyService>;
  let tokenService: jasmine.SpyObj<TokenService>;

  beforeEach(async () => {
    spotifyService = jasmine.createSpyObj('SpotifyService', [
      'generateAccessToken',
    ]);
    spotifyService.generateAccessToken.and.returnValue(of(accessTokenMock));

    tokenService = jasmine.createSpyObj('TokenService', ['setToken']);

    await TestBed.configureTestingModule({
      imports: [AppComponent, HttpClientTestingModule],
      providers: [
        { provide: SpotifyService, useValue: spotifyService },
        { provide: TokenService, useValue: tokenService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`#constructor should call the #generateAccessToken from
  SpotifyService and pass the generated access token to the
  TokenService #setToken method`, () => {
    expect(spotifyService.generateAccessToken).toHaveBeenCalled();
    expect(tokenService.setToken).toHaveBeenCalledWith(accessTokenMock);
  });
});
