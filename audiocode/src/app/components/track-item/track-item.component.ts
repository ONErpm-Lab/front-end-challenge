import { DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { TrackData } from '../../models/track.model';

@Component({
  selector: 'app-track-item',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './track-item.component.html',
  styleUrls: ['./track-item.component.scss']
})
export class TrackItemComponent {
  @Input({ required: true }) track!: TrackData;
}