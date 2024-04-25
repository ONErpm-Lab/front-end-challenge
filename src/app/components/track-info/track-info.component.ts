import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faChevronLeft, faQrcode } from '@fortawesome/free-solid-svg-icons';
import { Track } from 'spotify-types';
import formatTracks from '../../helpers/format-track.helper';
import { TrackCardComponent } from '../track-card/track-card.component';

@Component({
  selector: 'app-track-info',
  standalone: true,
  imports: [DatePipe, FontAwesomeModule, TrackCardComponent],
  templateUrl: './track-info.component.html',
  styleUrl: './track-info.component.scss',
})
export class TrackInfoComponent {
  private route = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private routeTracks = this.route.getCurrentNavigation()?.extras.state?.[
    'tracks'
  ] as Track[];

  protected tracks = formatTracks(this.routeTracks);
  protected isrc = this.activatedRoute.snapshot.params['isrc'];
  protected icons = {
    faQrcode,
    faChevronLeft,
  };

  protected back(): void {
    this.route.navigate(['/home']);
  }
}
