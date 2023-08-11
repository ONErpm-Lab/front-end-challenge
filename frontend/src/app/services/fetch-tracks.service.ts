import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, catchError, throwError } from "rxjs";
import { Track } from "../models/interfaces";


@Injectable({
  providedIn: "root"
})
class FetchTracksService {
  constructor(private http: HttpClient) {}
  
  fetchTracks(): Observable<{ data: Track[] }> {
    return this.http.get<{ data: Track[] }>("http://localhost:3000/tracks")
      .pipe(
        catchError(error => {
          console.error("Error fetching tracks:", error);
          return throwError(
            () => new Error("An error occurred while fetching tracks.")
          );
        })
      );
    ;
  }
}

export { FetchTracksService };