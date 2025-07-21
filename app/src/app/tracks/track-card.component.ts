import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Track } from './track.model';

@Component({
  selector: 'app-track-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './track-card.component.html',
  styleUrls: ['./track-card.component.scss'],
})
export class TrackCardComponent {
  @Input({ required: true }) track!: Track;

  get formattedDuration(): string {
    const totalSeconds = Math.floor(this.track.durationMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}
