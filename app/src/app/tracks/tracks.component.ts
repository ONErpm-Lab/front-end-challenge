import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpotifyService } from '../core/services/spotify.service';
import { Track } from './track.model';

/**
 * Type guard para remover faixas nulas do array
 */
function isValidTrack(track: Track | null): track is Track {
  return track !== null;
}

@Component({
  standalone: true,
  selector: 'app-tracks',
  imports: [CommonModule],
  templateUrl: './tracks.component.html',
  styleUrls: ['./tracks.component.scss'],
})
export class TracksComponent implements OnInit {
  // Lista fornecida no desafio
  private readonly isrcList: string[] = [
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

  // Estado da aplicação
  tracks: Track[] = [];
  error = false;

  // Injeção moderna
  private spotifyService = inject(SpotifyService);

  ngOnInit(): void {
    this.spotifyService.fetchTracksByISRCList(this.isrcList).subscribe({
      next: (result) => {
        this.tracks = result
          .filter((track): track is Track => track !== null)
          .sort((a, b) => a.title.localeCompare(b.title));
      },
      error: () => {
        this.error = true;
      },
    });
  }
}
