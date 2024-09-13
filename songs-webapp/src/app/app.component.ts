import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { CardComponent } from './components/card/card.component';
import { FooterComponent } from './components/footer/footer.component';
import { HttpClient } from '@angular/common/http';
import { SongsService } from './services/songs.service';
import { SongInterface } from './SongInterface';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, CardComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  ISRC = [
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
  ]
  cards: SongInterface[] = []
  notFoundSongs: string[] = []
  constructor(private songsService: SongsService) {}

  ngOnInit(): void {
    //Responsável por obter os dados das músicas listadas em ISRC ao iniciar a aplicação
    for (let index = 0; index < this.ISRC.length; index++) {

      this.songsService.getSong(this.ISRC[index]).subscribe({

        next: (data) => {
          
          if (data.tracks.items[0] === undefined){
            this.notFoundSongs.push(this.ISRC[index])
            return
          } 

          let card = {
            id: data.tracks.items[0].id,
            name: data.tracks.items[0].name,
            artists: data.tracks.items[0].artists,
            image: data.tracks.items[0].album.images[1].url,
            releaseDate: new Date(
              data.tracks.items[0].album.release_date
            ).toLocaleDateString(),
            durationMinutesSeconds: this.msToMinutesandSeconds(
              data.tracks.items[0].duration_ms
            ),
            spotifyLink: data.tracks.items[0].external_urls.spotify,
            avaiableBr: true,
            snippet: data.tracks.items[0].preview_url,
          }

          this.cards.push(card)
        },
        error: (error) => {
          console.error('Erro ao obter dados', error.message)
        },
      })
    }
  }

    msToMinutesandSeconds(ms: number) {
      let minutes = Math.floor(ms / 60000);
      let seconds = ((ms % 60000) / 1000).toFixed(0);
      return minutes + ':' + (parseInt(seconds) < 10 ? '0' : '') + seconds
    }
}
