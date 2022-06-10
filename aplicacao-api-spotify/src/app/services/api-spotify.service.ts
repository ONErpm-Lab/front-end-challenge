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
      "Authorization": "Bearer BQC1CL0dP8mpdQXzfSjjsTwMhszgynBQYcE5C4aPi-IDSS4w9gMwW8OyBMw8d2DGV4s-H_ME4mIkCKHWPFNtThMbGi2S3hHNT26zXgCGzfBFgRYvOc3HSucYgpwsVwKt2qAP7K68XaFum57GkfESeSdde7c8BaCcL8B7FxJ3ksImUXRBy03iLnOwvyt0jg",
    });

    return this.httpClient.get<any[]>(`${this.URL_API}${isrc}&type=track`, { headers });
  }
}
