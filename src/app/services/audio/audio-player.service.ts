import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AudioPlayerService {
  private currentAudio: HTMLAudioElement | null = null;
  private currentPlayingIdSubject = new BehaviorSubject<string | null>(null);
  
  currentPlayingId$ = this.currentPlayingIdSubject.asObservable();

  togglePlay(track: any): void {
    if (this.isPlaying(track.id)) {
      this.pause();
    } else {
      this.playTrack(track);
    }
  }

  private playTrack(track: any): void {
    this.pause();
    
    if (track.preview_url) {
      this.currentAudio = new Audio(track.preview_url);
      this.currentPlayingIdSubject.next(track.id);
      
      this.currentAudio.addEventListener('ended', () => {
        this.onAudioEnded();
      });
      
      this.currentAudio.play().catch(error => {
        console.error('Erro ao reproduzir áudio:', error);
        this.onAudioError();
      });
    }
  }

  private pause(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
      this.currentPlayingIdSubject.next(null);
    }
  }

  isPlaying(trackId: string): boolean {
    const currentId = this.currentPlayingIdSubject.value;
    return currentId === trackId && !!this.currentAudio && !this.currentAudio.paused;
  }

  private onAudioEnded(): void {
    this.currentPlayingIdSubject.next(null);
    this.currentAudio = null;
  }

  private onAudioError(): void {
    this.currentPlayingIdSubject.next(null);
    this.currentAudio = null;
  }

  destroy(): void {
    this.pause();
  }
}