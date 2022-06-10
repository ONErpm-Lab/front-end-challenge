import { Component, OnInit } from '@angular/core';
import { ApiSpotifyService } from 'src/app/services/api-spotify.service';

@Component({
  selector: 'app-tracks-list',
  templateUrl: './tracks-list.component.html',
  styleUrls: ['./tracks-list.component.scss']
})
export class TracksListComponent implements OnInit {
  items: Array<any> = [];

  listISRCs: string[] = [
    "US7VG1846811",
    "US7QQ1846811",
    "BRC310600002",
    "BR1SP1200071",
    "BR1SP1200070",
    "BR1SP1500002",
    "BXKZM1900338",
    "BXKZM1900345",
    "QZNJX2081700",
    "QZNJX2078148"
  ];

  constructor(
    private readonly apiSpotifyService: ApiSpotifyService,
  ) { }

  ngOnInit(): void {
    this.listTracks();
  }

  listTracks() {
    this.listISRCs.forEach(isrc => {
      let eachISRC = isrc;

      this.apiSpotifyService.ready(eachISRC).subscribe(track => {
        this.items.push(...track["tracks"].items);
      });
    });
  }
}
