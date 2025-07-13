import { Component } from "@angular/core";
import {
  MatSlideToggleChange,
  MatSlideToggleModule,
} from "@angular/material/slide-toggle";
import { NotificationService } from "../../services/notification/notification.service";

@Component({
  selector: "app-header",
  imports: [MatSlideToggleModule],
  templateUrl: "./header.component.html",
  styleUrl: "./header.component.scss",
})
export class HeaderComponent {
  checked = false;
  disabled = false;

  constructor(private notificationService: NotificationService) {}

  onToggleChange(event: MatSlideToggleChange): void {
    this.checked = event.checked;
    this.notificationService.setNotification(event.checked);
  }
}
