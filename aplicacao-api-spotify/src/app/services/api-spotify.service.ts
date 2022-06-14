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
      "Authorization": "Bearer BQCsuE5FsUzKdUV7_GZaWQ_CUw9q3d09roRWEO_TfpSav5a0d_4Pw05WcM9UYZnjEzzwp4jJSl8cpHyNUGT1M_RArynQijLpsqF6tlUy4czyVSQ4_U6KHRIqVJeuKF_tk7o4KLSVxegjx1oMJMBWG5U0fjRMB77C91PM1K8sb0q40G9eB4FePRcF8Vl32w",
    });

    return this.httpClient.get<any[]>(`${this.URL_API}${isrc}&type=track`, { headers });
  }
}
