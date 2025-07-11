import { Component, OnInit, signal, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { forkJoin, of } from "rxjs";
import { catchError } from "rxjs/operators";
import { SpotifyService } from "./core/services/spotify.service";
import { TrackListComponent } from "./pages/track-list/track-list.component";
import { LoadingComponent } from "./shared/components/loading/loading.component";
import { ErrorMessageComponent } from "./shared/components/error-message/error-message.component";
import { Track } from "./pages/track-list/models/track.model";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, TrackListComponent, LoadingComponent, ErrorMessageComponent],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.scss"
})
export class AppComponent implements OnInit {
  title = "Spotify ONErpm";

  isrcs = [
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

  tracks = signal<Track[]>([]);
  loading = signal(true);
  errorMessage = signal<string | null>(null);

  private spotifyService = inject(SpotifyService);

  ngOnInit(): void {
    this.fetchTracks();
  }

  fetchTracks(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    const trackObservables = this.isrcs.map(isrc => this.spotifyService.searchTrackByIsrc(isrc).pipe());

    forkJoin(trackObservables).subscribe({
      next: (results: (Track | null)[]) => {
        const foundTracks = results.filter((track): track is Track => track !== null);
        this.tracks.set(foundTracks.sort((a, b) => a.title.localeCompare(b.title)));
        this.loading.set(false);
        if (foundTracks.length === 0) {
          this.errorMessage.set("Nenhuma faixa encontrada para os ISRCs fornecidos.");
        } else {
          this.errorMessage.set(null);
        }
      },
      error: err => {
        this.loading.set(false);
        this.errorMessage.set("Ocorreu um erro inesperado durante a busca das faixas.");
      },
      complete: () => {
        this.loading.set(false);
      }
    });
  }
}
