import { Component, EventEmitter, Output } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faCircleXmark,
  faFaceSadTear,
  faMicrophoneLinesSlash,
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [FontAwesomeModule],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss',
})
export class ModalComponent {
  @Output() modalClosed = new EventEmitter<void>();

  protected icons = {
    faMicrophoneLinesSlash,
    faFaceSadTear,
    faCircleXmark,
  };

  protected close(): void {
    this.modalClosed.emit();
  }
}
