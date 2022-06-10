import { Component, OnInit } from '@angular/core';
import { ApiSpotifyService } from 'src/app/services/api-spotify.service';

@Component({
  selector: 'app-tracks-list',
  templateUrl: './tracks-list.component.html',
  styleUrls: ['./tracks-list.component.scss']
})
export class TracksListComponent implements OnInit {
  tracks: Array<any> = [];

  constructor(
    private readonly apiSpotifyService: ApiSpotifyService,
  ) { }

  ngOnInit(): void {
    this.listTracks();
  }

  listTracks() {
    this.apiSpotifyService.ready().subscribe(tracks => {
      this.tracks = tracks["tracks"];
      console.log(tracks);
    });
  }
}
