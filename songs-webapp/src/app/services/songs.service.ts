import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})

export class SongsService {

  private clientId = import.meta.env.NG_APP_SPOTIFY_CLIENT_ID

  private clientSecret = import.meta.env.NG_APP_SPOTIFY_CLIENT_SECRET

  private apiUrl = import.meta.env.NG_APP_SPOTIFY_API_URL + '?type=track&include_external=audio&q=isrc:'

  private tokenApiUrl = import.meta.env.NG_APP_TOKEN_API_URL

  constructor(private http: HttpClient) {}

  onInit() {

    //Ao iniciar o serviço é feita a requisição para obter o token de acesso a API do Spotify
    this.getToken().subscribe({
      next: (data) => {
        const token = `${data.token_type} ${data.access_token}`
        //O token é guardado no sessionStorage
        sessionStorage.setItem('@spotifyToken', token) 
      },
      error: (error) => {
        console.error('Erro ao obter token', error.message)
      }
    })
  }
  
  //Metodo para obter o token de acesso a API do Spotify
  getToken(): Observable<any> {
    return this.http.post(
      this.tokenApiUrl,
      `grant_type=client_credentials&client_id=${this.clientId}&client_secret=${this.clientSecret}`, 
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
  }

  //Metodo para fazer a requisição a API do Spotify e obter a musica pelo isrc utilizando o token de acesso guardado no sessionStorage
  getSong(isrc: string): Observable<any> {

    return this.http.get(this.apiUrl + isrc, {
      headers: {
        Authorization: sessionStorage.getItem('@spotifyToken')?.toString() || ''
      }
    })
  }
}
