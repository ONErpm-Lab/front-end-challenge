import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './card.component.html',
  styleUrl: './card.component.css'
})
export class CardComponent {
  @Input() thumbUrl: string = '';
  @Input() title: string = '';
  @Input() releaseDate: string = '';
  @Input() artists: string[] = [];
  @Input() duration: string = '';
  @Input() previewUrl: string = '';
  @Input() spotifyUrl: string = '';
  @Input() isAvailableInBR: boolean = false;

  getAvailabilityIcon(): string {
    if (this.isAvailableInBR === true) {
      return 'assets/brazil.png'; // Ícone de disponível no Brasil
    } else if (this.isAvailableInBR === false) {
      return 'assets/not-available.png'; // Ícone de não disponível no Brasil
    } else {
      return 'assets/not-available.png'; // Ícone para informação desconhecida
    }
  }
}
