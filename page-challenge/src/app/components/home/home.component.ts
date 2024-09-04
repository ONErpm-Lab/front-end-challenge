import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { AllTrack, Track } from '../../interfaces/track.intercafe';
import { SpotifyService } from '../../services/spotify.service';
import { HttpClientModule } from '@angular/common/http';
import { TrackListComponent } from "../track-list/track-list.component"
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    HeaderComponent,
    HttpClientModule,
    TrackListComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  title = 'page-challenge';
  track: AllTrack | null = null;

  constructor(private spotifyService: SpotifyService) { }

  ngOnInit() {
    this.spotifyService.getTrackByISRC('ISRC_DO_TRACK').subscribe(
      (data) => {
        this.track = data;
      },
      (error) => {
        console.error('Erro ao buscar a faixa:', error);
      }
    );
  }
}
