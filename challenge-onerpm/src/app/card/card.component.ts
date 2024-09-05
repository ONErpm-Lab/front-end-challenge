import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IsrcListComponent } from '../isrc-list/isrc-list.component';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [
    CommonModule,
    IsrcListComponent
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
}
