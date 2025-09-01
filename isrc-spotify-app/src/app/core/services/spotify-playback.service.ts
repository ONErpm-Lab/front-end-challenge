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

  /**
   * Inicializa o Spotify Web Playback SDK
   */
  private async initializeSpotifySDK(): Promise<void> {
    try {
      // Verifica se o Spotify Web Playback SDK está disponível
      if (typeof window !== 'undefined' && window.Spotify) {
        await this.setupSpotifyPlayer();
      } else {
        // Carrega o SDK se não estiver disponível
        await this.loadSpotifySDK();
      }
    } catch (error) {
      console.warn('Spotify Web Playback SDK não disponível:', error);
    }
  }

  /**
   * Carrega o Spotify Web Playback SDK
   */
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

  /**
   * Configura o player do Spotify
   */
  private async setupSpotifyPlayer(): Promise<void> {
    try {
      // Verifica se o usuário está logado no Spotify
      const token = await this.getSpotifyToken();

      if (!token) {
        console.warn('Usuário não está logado no Spotify');
        return;
      }

      // Cria o player
      this.player = new window.Spotify.Player({
        name: 'ISRC Spotify App Player',
        getOAuthToken: (cb: (token: string) => void) => {
          cb(token);
        },
      });

      // Configura os event listeners
      this.setupEventListeners();

      // Conecta o player
      await this.player.connect();
      this._isConnected.set(true);

      console.log('🎵 Spotify Web Playback SDK conectado!');
    } catch (error) {
      console.error('Erro ao configurar Spotify Player:', error);
    }
  }

  /**
   * Configura os event listeners do player
   */
  private setupEventListeners(): void {
    // Player pronto
    this.player.addListener('ready', ({ device_id }: { device_id: string }) => {
      this.deviceId = device_id;
      console.log('🎵 Dispositivo Spotify pronto:', device_id);
    });

    // Estado de reprodução atualizado
    this.player.addListener('player_state_changed', (state: any) => {
      if (state) {
        this.updatePlaybackState(state);
      }
    });

    // Erro de autenticação
    this.player.addListener('authentication_error', ({ message }: { message: string }) => {
      console.error('❌ Erro de autenticação Spotify:', message);
      this._isConnected.set(false);
    });

    // Erro de conta
    this.player.addListener('account_error', ({ message }: { message: string }) => {
      console.error('❌ Erro de conta Spotify:', message);
      this._isConnected.set(false);
    });

    // Erro de reprodução
    this.player.addListener('playback_error', ({ message }: { message: string }) => {
      console.error('❌ Erro de reprodução Spotify:', message);
    });

    // Player desconectado
    this.player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
      console.log('🔌 Dispositivo Spotify desconectado:', device_id);
      this._isConnected.set(false);
    });
  }

  /**
   * Atualiza o estado de reprodução
   */
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

  /**
   * Obtém o token do Spotify (simulado - em produção seria obtido via OAuth)
   */
  private async getSpotifyToken(): Promise<string | null> {
    // Em produção, isso seria obtido via OAuth flow
    // Por enquanto, retorna null para simular usuário não logado
    return null;
  }

  /**
   * Verifica se uma faixa específica está tocando
   */
  isTrackPlaying(trackId: string): boolean {
    const state = this._playbackState();
    return state.isPlaying && state.currentTrack?.id === trackId;
  }

  /**
   * Obtém o estado atual de reprodução
   */
  getCurrentPlaybackState(): SpotifyPlaybackState {
    return this._playbackState();
  }

  /**
   * Conecta o player (chamado quando o usuário faz login)
   */
  async connect(): Promise<void> {
    if (this.player) {
      await this.player.connect();
      this._isConnected.set(true);
    }
  }

  /**
   * Desconecta o player
   */
  async disconnect(): Promise<void> {
    if (this.player) {
      await this.player.disconnect();
      this._isConnected.set(false);
    }
  }

  /**
   * Tenta reproduzir uma faixa no Spotify
   */
  async playTrack(trackId: string): Promise<void> {
    if (!this._isConnected() || !this.deviceId) {
      console.warn('Spotify não conectado. Redirecionando para o app...');
      // Redireciona para o Spotify se não estiver conectado
      window.open(`spotify:track:${trackId}`, '_blank');
      return;
    }

    try {
      // Tenta reproduzir via Web Playback SDK
      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${this.deviceId}`, {
        method: 'PUT',
        body: JSON.stringify({ uris: [`spotify:track:${trackId}`] }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await this.getSpotifyToken()}`,
        },
      });
    } catch (error) {
      console.warn('Erro ao reproduzir via SDK, redirecionando para o app:', error);
      // Fallback: abre o Spotify
      window.open(`spotify:track:${trackId}`, '_blank');
    }
  }
}

// Extensão da interface Window para incluir o Spotify SDK
declare global {
  interface Window {
    Spotify: any;
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}
