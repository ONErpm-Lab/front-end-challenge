import { Component, Input, OnInit } from '@angular/core';
import { Track } from 'src/app/models/interfaces';
import { FormatDateService } from 'src/app/services';

@Component({
  selector: 'app-track',
  templateUrl: './track.component.html',
  styleUrls: ['./track.component.scss']
})
export class TrackComponent implements OnInit {
  @Input() track!: Track;
  isAvailableInBrazil: boolean = false;
  durationInMinutesAndSeconds: string = "";
  dateInDDMMYYYY: string = "";

  constructor(private formatDateService: FormatDateService) {}

  ngOnInit(): void {
    this.isAvailableInBrazil = this.track.availableMarkets.includes("BR");
    this.durationInMinutesAndSeconds = 
      this.calculateDurationInMinutesAndSeconds(
        this.track.durationInMilliseconds
      );
    this.dateInDDMMYYYY = this.formatDateToDDMMYYYY(this.track.releaseDate);
  }

  private formatDateToDDMMYYYY(date: string): string {
    return this.formatDateService.formatDateToDDMMYYYY(date);
  }

  private calculateDurationInMinutesAndSeconds(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds  = totalSeconds % 60;

    const formattedMinutes = `${minutes}`;
    const formattedSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;

    return `${formattedMinutes}:${formattedSeconds}`;
  }
}
