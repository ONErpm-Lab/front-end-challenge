import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";

@Injectable({
  providedIn: "root",
})
export class TokenService {
private tokenUrl = `${environment.accountsUrl}/token`;
  private clientId = ''; // Replace with yours Client ID
  private clientSecret = ''; // Replace with yours Client Secret

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
