import { Component, input } from "@angular/core";
import { CommonModule, NgOptimizedImage } from "@angular/common";
import { TruncatePipe } from "../../shared/pipe/truncate.pipe";
import { Track } from "./models/track.model";

@Component({
  selector: "app-track-list",
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, TruncatePipe],
  templateUrl: "./track-list.component.html",
  styleUrls: ["./track-list.component.scss"]
})
export class TrackListComponent {
  tracks = input<Track[]>([]);
}
