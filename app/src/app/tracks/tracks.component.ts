import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpotifyService } from '../core/services/spotify.service';
import { Track } from './track.model';

@Component({
  standalone: true,
  selector: 'app-tracks',
  imports: [CommonModule],
  templateUrl: './tracks.component.html',
  styleUrls: ['./tracks.component.scss'],
})
export class TracksComponent implements OnInit {
  isrcList: string[] = [
    'US7VG1846811',
    'US7QQ1846811',
    'BRC310600002',
    'BR1SP1200071',
    'BR1SP1200070',
    'BR1SP1500002',
    'BXKZM1900338',
    'BXKZM1900345',
    'QZNJX2081700',
    'QZNJX2078148',
  ];

  tracks: Track[] = [];
  error = false;

  constructor(private spotifyService: SpotifyService) {}

  ngOnInit(): void {
    this.spotifyService.fetchTracksByISRCList(this.isrcList).subscribe({
      next: (result: (Track | null)[]) => {
        // Filtramos os nulls antes de usar no array final
        const validTracks = result.filter((t): t is Track => t !== null);
        this.tracks = validTracks.sort((a, b) =>
          a.title.localeCompare(b.title)
        );
      },
      error: () => {
        this.error = true;
      },
    });
  }
}
