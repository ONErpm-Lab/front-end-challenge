import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

@Injectable({
  providedIn: "root"
})

export class ApiSpotifyService {
  private readonly URL_API = "https://api.spotify.com/v1/search?q=isrc%3A";

  constructor(
    private readonly httpClient: HttpClient,
  ) { }

  ready(isrc: string): Observable<any[]> {
    const headers = new HttpHeaders({
      "Authorization": "Bearer BQCKAZGOZy634fymGQ8sfU4YJqHTsuCeLc9APjPV0mgZSTydbBKCozNbJhFve_YZTSYMu1V1a-52hNw5y2rmDQEv4fQA34NXePkeAcEqoiqbXTSlWMlRmvpeW4FQ7vftt2RwOJRHEtB4SnyFiT3xdcKG6l8u8k8hnyqbqKWHX6X8qGyOomVf593dWYuVIg",
    });

    return this.httpClient.get<any[]>(`${this.URL_API}${isrc}&type=track`, { headers });
  }
}
