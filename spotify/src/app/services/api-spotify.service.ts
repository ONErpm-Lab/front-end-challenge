import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ErrorComponent } from '../components/error/error.component';

@Injectable({
  providedIn: 'root',
})
export class ApiSpotifyService {
  private readonly URL_API = 'https://api.spotify.com/v1/search?q=isrc%3A'; // URL da API
  private access_token: string = ''; // Token de acesso
  private client_id = 'b0fc17d5d51d42c2afdd6c1dbf8432ca'; // Client ID
  private client_secret = '14f0151a7c6b46ab873e0a7f1c2638fd'; // Client Secret

  constructor(
    private readonly httpClient: HttpClient,
    private dialog: MatDialog
  ) {
    // this.getToken();  // Descomentar para gerar o token e comentar novamente
  }

  private getToken() {
    // Método para gerar o token de acesso
    const url = 'https://accounts.spotify.com/api/token';
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.client_id,
      client_secret: this.client_secret,
    }).toString();

    this.httpClient.post(url, body, { headers }).subscribe(
      (data: any) => {
        this.access_token = data.access_token; //o token aparece aqui
        console.log('Token de acesso:', this.access_token);
      },
      (error) => {
        console.error('Ocorreu um erro:', error);
      }
    );
  }

  handleApiError(error: any) {
    let errorMessage = 'Ocorreu um erro.';
    if (error.status === 401) {
      errorMessage = 'Token expirou. Por favor, gere um novo token.';
    }
    this.openErrorPopup(errorMessage);
  }

  openErrorPopup(errorMessage: string) {
    this.dialog.open(ErrorComponent, {
      data: errorMessage,
      width: '200px',
    });
  }

  getISRC(isrc: string): Observable<any> {
    // Método para buscar o ISRC
    const headers = new HttpHeaders({
      Authorization:
        'Bearer BQC6_MpI-tosY6zp77LEjjgidcRAOhOv38ZdWSBq4_MgODKh9sj8h3nLf-nSrXJ_1oRvOqfb_tydPaSyHX6SjAWr6ZHj0qUORrEoStzuFKy8YMihnYU',
    });
    return this.httpClient
      .get<any[]>(`${this.URL_API}${isrc}&type=track`, { headers })
      .pipe(
        catchError((error) => {
          console.log('API error:', error);
          this.handleApiError(error);
          throw error;
        })
      );
  }

  getTrackDetails(trackId: string): Observable<any> {
    // Método para buscar os detalhes da música
    const headers = new HttpHeaders({
      Authorization:
        'Bearer BQC6_MpI-tosY6zp77LEjjgidcRAOhOv38ZdWSBq4_MgODKh9sj8h3nLf-nSrXJ_1oRvOqfb_tydPaSyHX6SjAWr6ZHj0qUORrEoStzuFKy8YMihnYU',
    });
    return this.httpClient
      .get<any>(`https://api.spotify.com/v1/tracks/${trackId}`, { headers })
      .pipe(
        catchError((error) => {
          console.log('API error:', error);
          this.handleApiError(error);
          throw error;
        })
      );
  }
}
