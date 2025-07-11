import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";

@Injectable({
  providedIn: "root",
})
export class TokenService {
private tokenUrl = `${environment.apiUrl}/token`;
  private clientId = '57c21d30e79c44d39415a4fc0a157afa'; // Substitua pelo seu Client ID
  private clientSecret = 'eb21c7b523af4c47bfa94835e84527c5'; // Substitua pelo seu Client Secret

  constructor(private http: HttpClient) {}

  getAccessToken(): Observable<any> {
    const credentials = btoa(`${this.clientId}:${this.clientSecret}`);

    const headers = new HttpHeaders({
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    });

    const body = new HttpParams().set("grant_type", "client_credentials");

    return this.http.post(this.tokenUrl, body.toString(), { headers });
  }
}
