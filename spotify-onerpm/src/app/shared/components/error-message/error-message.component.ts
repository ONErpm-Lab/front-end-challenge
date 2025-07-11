import { Component, input, output } from "@angular/core";

@Component({
  selector: "app-error-message",
  templateUrl: "./error-message.component.html",
  styleUrls: ["./error-message.component.scss"]
})
export class ErrorMessageComponent {
  errorMessage = input<string | null>(null);

  tryAgain = output<void>();

  onTryAgain(): void {
    this.tryAgain.emit();
  }
}
