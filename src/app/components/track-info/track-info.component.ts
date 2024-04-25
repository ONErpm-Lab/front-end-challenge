import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Track } from 'spotify-types';
import formatTracks from '../../helpers/format-track.helper';

@Component({
  selector: 'app-track-info',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './track-info.component.html',
  styleUrl: './track-info.component.scss',
})
export class TrackInfoComponent {
  private route = inject(Router);
  private routeTracks = this.route.getCurrentNavigation()?.extras.state?.[
    'tracks'
  ] as Track[];

  protected tracks = formatTracks(this.routeTracks);
}
