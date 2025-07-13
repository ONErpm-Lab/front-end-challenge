import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MissingTrackCardComponent } from './missing-track-card.component';
import { IMissingTrackCardProps } from '../../types/tracks.types';
import { provideZonelessChangeDetection } from '@angular/core';

describe('MissingTrackCardComponent', () => {
  let component: MissingTrackCardComponent;
  let fixture: ComponentFixture<MissingTrackCardComponent>;

  const mockTrack: IMissingTrackCardProps = {
    name: 'Música Teste',
    albumImage: 'https://img.com/album.jpg',
    hasTrack: true,
    artist: 'Artista Teste',
    albumReleaseDate: '01/01/2020',
    isrc: 'ISRC123',
    duration: '3:00',
    isAvailableInBrazil: true,
    spotifyUrl: 'https://open.spotify.com/track/123',
    previewUrl: 'https://audio.com/preview.mp3',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MissingTrackCardComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
    fixture = TestBed.createComponent(MissingTrackCardComponent);
    component = fixture.componentInstance;
  });

  it('should display the track data', () => {
    component.track = mockTrack;
    fixture.detectChanges();
    const title = fixture.nativeElement.querySelector(
      '[data-testid="track-title"]'
    );
    expect(title.textContent).toContain('Música Teste');
    const artist = fixture.nativeElement.querySelector(
      '[data-testid="track-artist"]'
    );
    expect(artist.textContent).toContain('Artista Teste');
    const img = fixture.nativeElement.querySelector(
      '[data-testid="track-album-image"]'
    );
    expect(img).toBeTruthy();
    const button = fixture.nativeElement.querySelector(
      '[data-testid="track-spotify-button"]'
    );
    expect(button).toBeTruthy();
    const audio = fixture.nativeElement.querySelector(
      '[data-testid="track-audio"]'
    );
    expect(audio).toBeTruthy();
  });

  it('should display "Sem imagem" when there is no albumImage', () => {
    component.track = { ...mockTrack, albumImage: null };
    fixture.detectChanges();
    const emptyImg = fixture.nativeElement.querySelector(
      '[data-testid="track-image-empty"]'
    );
    expect(emptyImg).toBeTruthy();
    expect(emptyImg.textContent).toContain('Sem imagem');
  });

  it('should display "Música não encontrada" when the track is not found', () => {
    component.track = { ...mockTrack, hasTrack: false };
    fixture.detectChanges();
    const notFound = fixture.nativeElement.querySelector(
      '[data-testid="track-not-found-title"]'
    );
    expect(notFound.textContent).toContain('Música não encontrada');
    const desc = fixture.nativeElement.querySelector(
      '[data-testid="track-not-found-desc"]'
    );
    expect(desc.textContent).toContain('não foi encontrada no Spotify');
  });

  it('should not display the audio player when there is no previewUrl', () => {
    component.track = { ...mockTrack, previewUrl: null };
    fixture.detectChanges();
    const audio = fixture.nativeElement.querySelector(
      '[data-testid="track-audio"]'
    );
    expect(audio).toBeFalsy();
  });

  it('should open the Spotify URL when the button is clicked', () => {
    spyOn(window, 'open');
    component.track = mockTrack;
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector(
      '[data-testid="track-spotify-button"]'
    );
    button.click();
    expect(window.open).toHaveBeenCalledWith(
      mockTrack.spotifyUrl as string,
      '_blank'
    );
  });
});
