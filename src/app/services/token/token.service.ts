import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IToken } from '../../model/token.interface';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
private tokenUrl = 'https://accounts.spotify.com/api/token';
  private clientId = '57c21d30e79c44d39415a4fc0a157afa'; // Substitua pelo seu Client ID
  private clientSecret = 'eb21c7b523af4c47bfa94835e84527c5'; // Substitua pelo seu Client Secret

  constructor(private http: HttpClient) {}

  getAccessToken(): Observable<any> {
    // Codificar Client ID e Client Secret em Base64
    const credentials = btoa(`${this.clientId}:${this.clientSecret}`);

    // Configurar headers
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`
    });

    // Configurar body como x-www-form-urlencoded
    const body = new HttpParams()
      .set('grant_type', 'client_credentials');

    // Fazer a requisição POST
    return this.http.post(this.tokenUrl, body.toString(), { headers });
  }

  saveToken(token: IToken): void {
    sessionStorage.setItem('token', JSON.stringify(token));
  }
}