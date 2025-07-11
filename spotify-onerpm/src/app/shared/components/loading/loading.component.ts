import { Component, input } from "@angular/core";

@Component({
  selector: "app-loading",
  templateUrl: "./loading.component.html",
  styleUrl: "./loading.component.scss"
})
export class LoadingComponent {
  isLoading = input(false);
}
