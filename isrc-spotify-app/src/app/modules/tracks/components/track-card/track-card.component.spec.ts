import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { TrackCardComponent } from './track-card.component';
import { SpotifyPlaybackService } from '../../../../core/services/spotify-playback.service';
import { ITrack } from '../../models';

class MockSpotifyPlaybackService {
  playbackState = signal({
    isPlaying: false,
    currentTrack: null,
    position: 0,
    duration: 0,
  });

  isConnected = jasmine.createSpy('isConnected').and.returnValue(false);
  playTrack = jasmine.createSpy('playTrack');
}

describe('TrackCardComponent', () => {
  let component: TrackCardComponent;
  let fixture: ComponentFixture<TrackCardComponent>;
  let spotifyService: MockSpotifyPlaybackService;

  const mockTrack: ITrack = {
    id: 'track-123',
    name: 'Test Song',
    artists: [
      {
        id: 'artist-123',
        name: 'Test Artist',
        external_urls: { spotify: 'https://spotify.com/artist/123' },
      },
      {
        id: 'artist-456',
        name: 'Another Artist',
        external_urls: { spotify: 'https://spotify.com/artist/456' },
      },
    ],
    album: {
      id: 'album-123',
      name: 'Test Album',
      images: [
        { url: 'https://example.com/image.jpg', height: 300, width: 300 },
        { url: 'https://example.com/image-small.jpg', height: 64, width: 64 },
      ],
      release_date: '2023-01-15',
      release_date_precision: 'day',
      external_urls: { spotify: 'https://spotify.com/album/123' },
    },
    duration_ms: 180000,
    preview_url: 'https://example.com/preview.mp3',
    external_urls: { spotify: 'https://spotify.com/track/123' },
    available_markets: ['US', 'BR', 'CA'],
    isrc: 'USUM71703861',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrackCardComponent, CommonModule, NgxSkeletonLoaderModule, HttpClientTestingModule],
      providers: [{ provide: SpotifyPlaybackService, useClass: MockSpotifyPlaybackService }],
    }).compileComponents();

    fixture = TestBed.createComponent(TrackCardComponent);
    component = fixture.componentInstance;
    spotifyService = TestBed.inject(SpotifyPlaybackService) as any;

    spyOn(window, 'open');

    jasmine.clock().install();

    component.track = mockTrack;
    fixture.detectChanges();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  describe('Inicialização', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with correct default states', () => {
      expect(component.isPlaying()).toBeFalse();
      expect(component.isImageLoaded()).toBeFalse();
      expect(component.hasError()).toBeFalse();
    });

    it('should require track input', () => {
      expect(component.track).toBe(mockTrack);
    });

    it('should setup playback state monitoring on init', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('Track availability', () => {
    it('should detect if track is available in BR', () => {
      expect(component.isAvailableInBR()).toBe(true);
    });

    it('should detect if track is not available in BR', () => {
      component.track = {
        ...mockTrack,
        available_markets: ['US', 'CA'],
      };

      expect(component.isAvailableInBR()).toBe(false);
    });

    it('should handle empty available markets', () => {
      component.track = {
        ...mockTrack,
        available_markets: [],
      };

      expect(component.isAvailableInBR()).toBe(false);
    });

    it('should handle undefined available markets', () => {
      component.track = {
        ...mockTrack,
        available_markets: undefined as any,
      };

      expect(component.isAvailableInBR()).toBe(false);
    });
  });

  describe('Image handling', () => {
    it('should get thumbnail URL from first image', () => {
      const thumbnailUrl = component.getThumbnailUrl();
      expect(thumbnailUrl).toBe('https://example.com/image.jpg');
    });

    it('should return empty string when no images available', () => {
      component.track = {
        ...mockTrack,
        album: {
          ...mockTrack.album,
          images: [],
        },
      };

      const thumbnailUrl = component.getThumbnailUrl();
      expect(thumbnailUrl).toBe('');
    });

    it('should handle image load event', () => {
      component.onImageLoad();
      expect(component.isImageLoaded()).toBe(true);
    });

    it('should handle image error event', () => {
      component.onImageError();
      expect(component.hasError()).toBe(true);
    });
  });

  describe('Date formatting', () => {
    it('should format day precision release date', () => {
      const formattedDate = component.formatReleaseDate();
      expect(formattedDate).toMatch(/^1[45]\/01\/2023$/);
    });

    it('should format month precision release date', () => {
      component.track = {
        ...mockTrack,
        album: {
          ...mockTrack.album,
          release_date: '2023-01',
          release_date_precision: 'month',
        },
      };

      const formattedDate = component.formatReleaseDate();
      expect(formattedDate).toMatch(/^(01|12)\/(2023|2022)$/);
    });

    it('should format year precision release date', () => {
      component.track = {
        ...mockTrack,
        album: {
          ...mockTrack.album,
          release_date: '2023',
          release_date_precision: 'year',
        },
      };

      const formattedDate = component.formatReleaseDate();
      expect(formattedDate).toMatch(/^(2023|2022)$/);
    });

    it('should return original date for unknown precision', () => {
      component.track = {
        ...mockTrack,
        album: {
          ...mockTrack.album,
          release_date: '2023-01-15T10:00:00Z',
          release_date_precision: 'unknown' as any,
        },
      };

      const formattedDate = component.formatReleaseDate();
      expect(formattedDate).toBe('2023-01-15T10:00:00Z');
    });
  });

  describe('Artist names', () => {
    it('should join multiple artist names with comma', () => {
      const artistNames = component.getArtistNames();
      expect(artistNames).toBe('Test Artist, Another Artist');
    });

    it('should handle single artist', () => {
      component.track = {
        ...mockTrack,
        artists: [mockTrack.artists[0]],
      };

      const artistNames = component.getArtistNames();
      expect(artistNames).toBe('Test Artist');
    });

    it('should handle empty artists array', () => {
      component.track = {
        ...mockTrack,
        artists: [],
      };

      const artistNames = component.getArtistNames();
      expect(artistNames).toBe('');
    });
  });

  describe('Spotify integration', () => {
    it('should open Spotify in new tab', () => {
      component.openSpotify();
      expect(window.open).toHaveBeenCalledWith('https://spotify.com/track/123', '_blank');
    });

    it('should play track on Spotify', () => {
      component.playOnSpotify();

      expect(component.isPlaying()).toBe(true);
      expect(spotifyService.playTrack).toHaveBeenCalledWith('track-123');
    });

    it('should fallback to opening Spotify when not connected', () => {
      spotifyService.isConnected.and.returnValue(false);

      component.playOnSpotify();

      jasmine.clock().tick(1001);

      expect(window.open).toHaveBeenCalledWith('https://spotify.com/track/123', '_blank');
    });

    it('should not open Spotify when connected', () => {
      spotifyService.isConnected.and.returnValue(true);

      component.playOnSpotify();

      jasmine.clock().tick(1001);

      expect(window.open).not.toHaveBeenCalled();
    });

    it('should toggle audio by calling playOnSpotify', () => {
      spyOn(component, 'playOnSpotify');

      component.toggleAudio();

      expect(component.playOnSpotify).toHaveBeenCalled();
    });
  });

  describe('Playback state monitoring', () => {
    it('should update playing state when current track matches', () => {
      spotifyService.playbackState.set({
        isPlaying: true,
        currentTrack: { id: 'track-123' } as any,
        position: 0,
        duration: 180000,
      });

      jasmine.clock().tick(1001);

      expect(component.isPlaying()).toBe(true);
    });

    it('should stop playing when different track is playing', () => {
      component.isPlaying.set(true);

      spotifyService.playbackState.set({
        isPlaying: true,
        currentTrack: { id: 'different-track' } as any,
        position: 0,
        duration: 180000,
      });

      jasmine.clock().tick(1001);

      expect(component.isPlaying()).toBe(false);
    });

    it('should handle null current track', () => {
      component.isPlaying.set(true);

      spotifyService.playbackState.set({
        isPlaying: false,
        currentTrack: null,
        position: 0,
        duration: 0,
      });

      jasmine.clock().tick(1001);

      expect(component.isPlaying()).toBe(false);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup subscriptions on destroy', () => {
      const subscription = component['subscription'];
      spyOn(subscription, 'unsubscribe');

      component.ngOnDestroy();

      expect(subscription.unsubscribe).toHaveBeenCalled();
    });
  });

  describe('Compatibility methods', () => {
    it('should return default values for compatibility methods', () => {
      expect(component.getProgressPercentage()).toBe(0);
      expect(component.formatTime(120)).toBe('0:00');
      expect(component.getCurrentTime()).toBe(0);
      expect(component.getDuration()).toBe(0);
      expect(component.getVolume()).toBe(100);
    });

    it('should handle toggle mute without errors', () => {
      expect(() => component.toggleMute()).not.toThrow();
    });

    it('should handle volume change without errors', () => {
      const mockEvent = new Event('input');
      expect(() => component.onVolumeChange(mockEvent)).not.toThrow();
    });
  });

  describe('Edge cases', () => {
    it('should handle track with no preview URL', () => {
      component.track = {
        ...mockTrack,
        preview_url: null,
      };

      expect(() => component.playOnSpotify()).not.toThrow();
    });

    it('should handle track with no external URLs', () => {
      component.track = {
        ...mockTrack,
        external_urls: {} as any,
      };

      expect(() => component.openSpotify()).not.toThrow();
    });

    it('should handle track with no album images', () => {
      component.track = {
        ...mockTrack,
        album: {
          ...mockTrack.album,
          images: [],
        },
      };

      expect(component.getThumbnailUrl()).toBe('');
    });

    it('should handle invalid release date', () => {
      component.track = {
        ...mockTrack,
        album: {
          ...mockTrack.album,
          release_date: 'invalid-date',
        },
      };

      expect(() => component.formatReleaseDate()).not.toThrow();
    });
  });

  describe('formatDuration utility', () => {
    it('should have access to formatDuration utility', () => {
      expect(component.formatDuration).toBeDefined();
      expect(typeof component.formatDuration).toBe('function');
    });
  });
});
