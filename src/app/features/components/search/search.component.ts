import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SpotifyService } from '../../services/spotify.service';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search.component.html',
  styleUrl: './search.component.css',
})
export class SearchComponent {
  searchQuery: string = '';
  isLoading: boolean = false;
  error: string | null = null;

  constructor(private spotifyService: SpotifyService) {}

  onSearch() {
    if (!this.searchQuery.trim() || this.isLoading) return;

    this.isLoading = true;
    this.error = null;

    this.spotifyService.getTrackByIsrc(this.searchQuery).subscribe({
      next: (track) => {
        if (track) {
          this.spotifyService.addTrack(track);
          this.searchQuery = '';
        } else {
          this.error = 'Nenhuma faixa encontrada com este ISRC.';
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro na busca:', err);
        this.error = 'Erro ao buscar faixa. Tente novamente.';
        this.isLoading = false;
      },
    });
  }
}
