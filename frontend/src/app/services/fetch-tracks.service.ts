import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Router } from "@angular/router";
import { Observable, catchError, throwError } from "rxjs";

import { environment } from "src/environments/environment";
import { Track } from "../models/interfaces";


@Injectable({
  providedIn: "root"
})
class FetchTracksService {
  constructor(private http: HttpClient, private router: Router) {}
  
  fetchTracks(): Observable<{ data: Track[] }> {
    return this.http.get<{ data: Track[] }>(`${environment.apiUrl}/tracks`)
      .pipe(
        catchError(error => {
          console.error("Error fetching tracks:", error);
          return throwError(
            () => {
              alert("Integration with API is not working now, try again later.");
              this.router.navigate(["/"]);
              return new Error("An error occurred while fetching tracks.");
            }
          );
        })
      );
    ;
  }
}

export { FetchTracksService };