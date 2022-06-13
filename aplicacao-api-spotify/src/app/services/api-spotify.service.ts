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
      "Authorization": "Bearer BQA5GAzVzmYLH-_9MJmNPBrCkRlKEKu2_ssuojZMIM_GAvAumWlK8FEUKaOdGgNMlKnpRtOXM1iKwSwX6FS-XJPqp4BjK2th5PZPgsLXuERgm1YDVH4S-v6_1kSLrhwLDUNhdvEGa6PETR17mx9d3E3CMWuiUrLAWoYnIAHlEnbX7w688DDCJ-I6KiiTGw",
    });

    return this.httpClient.get<any[]>(`${this.URL_API}${isrc}&type=track`, { headers });
  }
}
