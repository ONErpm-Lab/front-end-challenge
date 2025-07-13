import { Component, Input } from "@angular/core";
import { ISearchSpotifyTrack } from "../../../spotify/types/spotify.types";
import { CommonModule } from "@angular/common";
import { IMissingTrackCardProps } from "../../types/tracks.types";
@Component({
  selector: 'app-missing-track-card',
  standalone: true,
  templateUrl: './missing-track-card.component.html',
  styleUrls: ['./missing-track-card.component.scss'],
  imports: [CommonModule],
})
export class MissingTrackCardComponent {
  @Input() track: IMissingTrackCardProps | null = null;

  openSpotify(url: string | null) {
    if (url) {
      window.open(url, '_blank');
    }
  }
}