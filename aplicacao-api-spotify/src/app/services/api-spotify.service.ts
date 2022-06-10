import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

@Injectable({
  providedIn: "root"
})

export class ApiSpotifyService {
  private readonly URL_API = "https://api.spotify.com/v1/search?q=isrc%3ABR1SP1500002&type=track";

  constructor(
    private readonly httpClient: HttpClient,
  ) { }

  ready(): Observable<any[]> {
    const headers = new HttpHeaders({
      "Authorization": "Bearer BQBAhU9UoAGzijppH8tZDYY8vrhcYvxfRIHGpHwogLdkwGtpmiDVXuKQ467uYJ-9FTsfjtNUI1z7Qlygjn4c6l9CufFXBuLQQQKipJqYIfzkX-ISA8nYk2bdqoQa39n4_7ZygXOe_VD1kA5Ehsosb_XtaKYc6Tq6kLCtDB6OK575dU0xSNCpcNlW5IwSKQ",
    });

    return this.httpClient.get<any[]>(this.URL_API, { headers });
  }
}
