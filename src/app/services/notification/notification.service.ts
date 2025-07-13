import { Injectable } from "@angular/core";
import { Subject } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class NotificationService {
  private notification: Subject<boolean> = new Subject<boolean>();

  setNotification(data: boolean): void {
    this.notification.next(data);
  }

  getNotification(): Subject<boolean> {
    return this.notification;
  }
}
