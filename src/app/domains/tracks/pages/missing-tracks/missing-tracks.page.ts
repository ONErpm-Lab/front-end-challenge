import { Component, OnInit, signal } from '@angular/core';
import { MissingTracksService } from '../../services/missing-tracks.service';
import { CommonModule } from '@angular/common';
import { missingTrackMapper } from '../../mappers/missing-track.mapper';
import { IMissingTrackCardProps } from '../../types/tracks.types';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { MissingTrackCardComponent } from '../../components/missing-track-card/missing-track-card.component';

@Component({
  selector: 'app-missing-tracks-page',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent, MissingTrackCardComponent],
  templateUrl: './missing-tracks.page.html',
  styleUrls: ['./missing-tracks.page.scss'],
})
export class MissingTracksPage implements OnInit {
  missingTracks = signal<IMissingTrackCardProps[]>([]);
  isLoading = signal<boolean>(true);
  hasError = signal<boolean>(false);

  constructor(private missingTracksService: MissingTracksService) {}

  ngOnInit(): void {
    this.missingTracksService.getMissingTracks().subscribe({
      next: (tracks) => {
        this.missingTracks.set(
          missingTrackMapper(tracks).sort((a, b) => {
            if (!a.name) return 1;
            if (!b.name) return -1;
            return a.name.localeCompare(b.name);
          })
        );
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error(error);
        this.hasError.set(true);
        this.isLoading.set(false);
      }
    });
  }
}
