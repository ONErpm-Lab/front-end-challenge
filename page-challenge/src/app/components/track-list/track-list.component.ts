import { Component, OnInit } from '@angular/core';
import { AllTrack, Track } from '../../interfaces/track.intercafe';
import { SpotifyService } from '../../services/spotify.service';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-track-list',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, ReactiveFormsModule, MatFormFieldModule, MatInputModule],
  templateUrl: './track-list.component.html',
  styleUrls: ['./track-list.component.scss']
})
export class TrackListComponent implements OnInit {
  tracks: Track[] = [];
  isrcControl: FormControl;

  constructor(private spotifyService: SpotifyService,
    private notificationService: NotificationService
  ) {
    this.isrcControl = new FormControl('', [
      Validators.required,
      Validators.pattern(/^[A-Z0-9]{12}$/)
    ]);
  }

  ngOnInit(): void { }

  searchTrack(): void {
    if (this.isrcControl.valid) {
      this.tracks = [];
      this.notificationService.clear();
      const isrcInput = this.isrcControl.value;
      this.spotifyService.getTrackByISRC(isrcInput).subscribe(
        (data: AllTrack) => this.handleTrackResponse(data),
        () => this.notificationService.showError('Erro ao buscar a faixa, Token inválido ou expirado.')
      );
    }
  }

  private handleTrackResponse(data: AllTrack): void {
    if (data.tracks.items.length > 0) {
      const track = this.mapTrackData(data.tracks.items[0]);
      this.tracks = [track];
    } else {
      this.tracks = [];
      this.notificationService.showWarning(`Nenhuma faixa encontrada para o ISRC ${this.isrcControl.value}.`);
    }
  }

  private mapTrackData(trackData: Track) {
    return {
      name: trackData.name,
      artists: trackData.artists.map(artist => ({ name: artist.name })),
      album: {
        images: trackData.album.images,
        name: trackData.album.name,
        release_date: trackData.album.release_date
      },
      duration_ms: trackData.duration_ms,
      is_playable: trackData.is_playable,
      external_urls: trackData.external_urls,
      preview_url: trackData.preview_url,
      available_markets: trackData.available_markets
    };
  }

  getArtistNames(artists: { name: string }[]): string {
    return artists.map(artist => artist.name).join(', ');
  }

  formatDuration(durationMs: number): string {
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  isAvailableInBrazil(availableMarkets: string[]): string {
    return availableMarkets.includes('BR') ? 'Sim' : 'Não';
  }
}
