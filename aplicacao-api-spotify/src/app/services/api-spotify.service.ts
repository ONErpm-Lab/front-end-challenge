import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

@Injectable({
  providedIn: "root"
})

export class ApiSpotifyService {
  private readonly URL_API = "https://api.spotify.com/v1/search?q=isrc%3AUS7VG1846811&type=track";

  constructor(
    private readonly httpClient: HttpClient,
  ) { }

  ready(): Observable<any[]> {
    const headers = new HttpHeaders({
      "Authorization": "Bearer BQC4yIupVMZgY6F3Krc4kSLiwuPmYVCGzFlxWbuorMH3PwIQZidjcQv71vGtN15XPOx3gc-n3jvRzflxOpTJuErroSlQ4tMMeg-d1qfoMUJSJgMOhIV_WDm_LZxgNh2frz8Le0hMBnihxyeh2Wbi1Q2t3ernDge8jphrVAOUCMcMN8qMYuKnUvCSub0MWQ",
    });

    return this.httpClient.get<any[]>(this.URL_API, { headers });
  }
}
