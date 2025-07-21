import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.dev';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private http: HttpClient) {}

  getAccessToken() {
    const headers = new HttpHeaders().set(
      'Content-Type',
      'application/x-www-form-urlencoded'
    );
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: environment.client_id,
      client_secret: environment.client_secret,
    });

    return this.http
      .post<{ access_token: string }>(environment.tokenUrl, body.toString(), {
        headers,
      })
      .pipe(
        tap((response) =>
          sessionStorage.setItem('accessToken', response.access_token)
        )
      );
  }
}
