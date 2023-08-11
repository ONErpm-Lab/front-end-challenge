import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiSpotifyService } from 'src/app/services/api-spotify.service';

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss'],
})
export class DetailsComponent {
  track: any;
  flag: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private apiSpotifyService: ApiSpotifyService
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const trackId = params['params'];
      if (trackId) {
        this.getTrackDetails(trackId);
      }
    });
  }

  getTrackDetails(trackId: string) {
    this.apiSpotifyService.getTrackDetails(trackId).subscribe((track: any) => {
      this.track = track;
    });
  }

  getCountryFlag() {
    if (this.track.available_markets.includes('BR')) {
      this.flag = true;
    }
  }
}
