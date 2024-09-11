import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { CardComponent } from './components/card/card.component';
import { FooterComponent } from './components/footer/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, CardComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'songs-webapp';
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
  ];
  cards = [
    {
      id: 1,
      title: 'Card 1',
      artist: 'Artist 1',
      album: 'Album 1',
      date: '2021-01-01',
      duration: '3:00',
      spotifyLink: 'https://open.spotify.com/track/1',
      avaiableBr: true,
      image: 'https://via.placeholder.com/200',
    },
    {
      id: 2,
      title: 'Card 2',
      artist: 'Artist 2',
      album: 'Album 2',
      date: '2021-01-02',
      duration: '3:00',
      spotifyLink: 'https://open.spotify.com/track/2',
      avaiableBr: true,
      image: 'https://via.placeholder.com/200',
    },
    {
      id: 3,
      title: 'Card 3',
      artist: 'Artist 3',
      album: 'Album 3',
      date: '2021-01-03',
      duration: '3:00',
      spotifyLink: 'https://open.spotify.com/track/3',
      avaiableBr: true,
      image: 'https://via.placeholder.com/200',
    },
    {
      id: 4,
      title: 'Card 4',
      artist: 'Artist 4',
      album: 'Album 4',
      date: '2021-01-04',
      duration: '3:00',
      spotifyLink: 'https://open.spotify.com/track/4',
      avaiableBr: true,
      image: 'https://via.placeholder.com/200',
    },
    {
      id: 5,
      title: 'Card 5',
      artist: 'Artist 5',
      album: 'Album 5',
      date: '2021-01-05',
      duration: '3:00',
      spotifyLink: 'https://open.spotify.com/track/5',
      avaiableBr: true,
      image: 'https://via.placeholder.com/200',
    },
    {
      id: 6,
      title: 'Card 6',
      artist: 'Artist 6',
      album: 'Album 6',
      date: '2021-01-06',
      duration: '3:00',
      spotifyLink: 'https://open.spotify.com/track/6',
      avaiableBr: true,
      image: 'https://via.placeholder.com/200',
    },
    {
      id: 7,
      title: 'Card 7',
      artist: 'Artist 7',
      album: 'Album 7',
      date: '2021-01-07',
      duration: '3:00',
      spotifyLink: 'https://open.spotify.com/track/7',
      avaiableBr: true,
      image: 'https://via.placeholder.com/200',
    },
    {
      id: 8,
      title: 'Card 8',
      artist: 'Artist 8',
      album: 'Album 8',
      date: '2021-01-08',
      duration: '3:00',
      spotifyLink: 'https://open.spotify.com/track/8',
      avaiableBr: true,
      image: 'https://via.placeholder.com/200',
    },
  ];
  //https://api.spotify.com/v1/search?q=%3Disrc%3A isrc &type=track&limit=1&include_external=audio
}
