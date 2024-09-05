import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CardComponent } from './card/card.component';
import { SpotifyService } from './services/spotify.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet, 
    CardComponent,
    HttpClientModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit{
  constructor(private spotifyService: SpotifyService) {}

  ngOnInit(): void {
    this.spotifyService.authenticate().subscribe({
      next: (token) => console.log('Autenticado com sucesso! Token: ', token),
      error: (error) => console.log('Erro ao autenticar: ', error)
    })
  }
}
