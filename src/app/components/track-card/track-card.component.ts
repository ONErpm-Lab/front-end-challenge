import { DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSpotify } from '@fortawesome/free-brands-svg-icons';
import {
  faCalendar,
  faCirclePlay,
  faFileAudio,
} from '@fortawesome/free-regular-svg-icons';
import {
  faArrowUpRightFromSquare,
  faHeadphonesSimple,
  faMicrophone,
  faVolumeHigh,
} from '@fortawesome/free-solid-svg-icons';
import TrackInfo from '../track-info/track-info.interface';

@Component({
  selector: 'app-track-card',
  standalone: true,
  imports: [DatePipe, FontAwesomeModule],
  templateUrl: './track-card.component.html',
  styleUrl: './track-card.component.scss',
})
export class TrackCardComponent {
  @Input() track: TrackInfo | undefined;

  protected icons = {
    faCalendar,
    faFileAudio,
    faMicrophone,
    faCirclePlay,
    faSpotify,
    faHeadphonesSimple,
    faVolumeHigh,
    faArrowUpRightFromSquare,
  };
}
