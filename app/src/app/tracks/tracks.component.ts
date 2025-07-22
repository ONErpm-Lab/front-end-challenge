import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpotifyService } from '../core/services/spotify.service';
import { Track } from './track.model';
import { TrackCardComponent } from './track-card.component';

@Component({
  standalone: true,
  selector: 'app-tracks',
  imports: [CommonModule, TrackCardComponent],
  templateUrl: './tracks.component.html',
  styleUrls: ['./tracks.component.scss'],
})
export class TracksComponent implements OnInit {
  // Lista fixa de ISRCs fornecidos
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

  // Resultado das faixas
  tracks: Track[] = [];

  // Injeta SpotifyService via função inject() (sem constructor)
  private spotifyService = inject(SpotifyService);

  /**
   * Inicializa o componente e dispara busca por faixas
   */
  ngOnInit(): void {
    this.spotifyService
      .fetchTracksByISRCList(this.isrcList)
      .subscribe((tracks) => {
        this.tracks = this.sortTracks(tracks);
      });
  }

  /**
   * Ordena faixas por título alfabético e empurra 'notFound' para o final.
   */
  private sortTracks(tracks: (Track | null)[]): Track[] {
    return tracks
      .filter((t): t is Track => t !== null)
      .sort((a, b) => {
        if (a.notFound && !b.notFound) return 1;
        if (!a.notFound && b.notFound) return -1;
        return a.title.localeCompare(b.title);
      });
  }
}
