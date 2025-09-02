import { Injectable, signal, computed } from '@angular/core';
import { BehaviorSubject, Observable, fromEvent } from 'rxjs';

export interface SpotifyPlaybackState {
  isPlaying: boolean;
  currentTrack: {
    id: string;
    name: string;
    artist: string;
    album: string;
    duration: number;
    progress: number;
  } | null;
  device: {
    id: string;
    name: string;
    type: string;
  } | null;
}

@Injectable({
  providedIn: 'root',
})
export class SpotifyPlaybackService {
  private readonly _isConnected = signal(false);
  private readonly _playbackState = signal<SpotifyPlaybackState>({
    isPlaying: false,
    currentTrack: null,
    device: null,
  });

  private player: any = null;
  private deviceId: string | null = null;

  readonly isConnected = this._isConnected.asReadonly();
  readonly playbackState = this._playbackState.asReadonly();

  constructor() {
    this.initializeSpotifySDK();
  }

  private async initializeSpotifySDK(): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.Spotify) {
        await this.setupSpotifyPlayer();
      } else {
        await this.loadSpotifySDK();
      }
    } catch (error) {}
  }

  private async loadSpotifySDK(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;

      script.onload = () => {
        window.onSpotifyWebPlaybackSDKReady = () => {
          this.setupSpotifyPlayer().then(resolve).catch(reject);
        };
      };

      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  private async setupSpotifyPlayer(): Promise<void> {
    try {
      const token = await this.getSpotifyToken();

      if (!token) {
        return;
      }

      this.player = new window.Spotify.Player({
        name: 'ISRC Spotify App Player',
        getOAuthToken: (cb: (token: string) => void) => {
          cb(token);
        },
      });

      this.setupEventListeners();

      await this.player.connect();
      this._isConnected.set(true);
    } catch (error) {}
  }

  private setupEventListeners(): void {
    this.player.addListener('ready', ({ device_id }: { device_id: string }) => {
      this.deviceId = device_id;
    });

    this.player.addListener('player_state_changed', (state: any) => {
      if (state) {
        this.updatePlaybackState(state);
      }
    });

    this.player.addListener('authentication_error', ({ message }: { message: string }) => {
      this._isConnected.set(false);
    });

    this.player.addListener('account_error', ({ message }: { message: string }) => {
      this._isConnected.set(false);
    });

    this.player.addListener('playback_error', ({ message }: { message: string }) => {});

    this.player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
      this._isConnected.set(false);
    });
  }

  private updatePlaybackState(state: any): void {
    const track = state.track_window?.current_track;

    if (track) {
      this._playbackState.set({
        isPlaying: !state.paused,
        currentTrack: {
          id: track.id,
          name: track.name,
          artist: track.artists?.[0]?.name || 'Artista desconhecido',
          album: track.album?.name || 'Álbum desconhecido',
          duration: track.duration_ms / 1000,
          progress: state.position / 1000,
        },
        device: {
          id: this.deviceId || '',
          name: 'Spotify Web Player',
          type: 'web',
        },
      });
    } else {
      this._playbackState.set({
        isPlaying: false,
        currentTrack: null,
        device: null,
      });
    }
  }

  private async getSpotifyToken(): Promise<string | null> {
    return null;
  }

  isTrackPlaying(trackId: string): boolean {
    const state = this._playbackState();
    return state.isPlaying && state.currentTrack?.id === trackId;
  }

  getCurrentPlaybackState(): SpotifyPlaybackState {
    return this._playbackState();
  }

  async connect(): Promise<void> {
    if (this.player) {
      await this.player.connect();
      this._isConnected.set(true);
    }
  }

  async disconnect(): Promise<void> {
    if (this.player) {
      await this.player.disconnect();
      this._isConnected.set(false);
    }
  }

  async playTrack(trackId: string): Promise<void> {
    if (!this._isConnected() || !this.deviceId) {
      window.open(`spotify:track:${trackId}`, '_blank');
      return;
    }

    try {
      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${this.deviceId}`, {
        method: 'PUT',
        body: JSON.stringify({ uris: [`spotify:track:${trackId}`] }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await this.getSpotifyToken()}`,
        },
      });
    } catch (error) {
      window.open(`spotify:track:${trackId}`, '_blank');
    }
  }
}

declare global {
  interface Window {
    Spotify: any;
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}
