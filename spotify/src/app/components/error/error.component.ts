import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-error-popup',
  template: `
    <h2>Error</h2>
    <p>{{ errorMessage }}</p>
  `,
})
export class ErrorComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public errorMessage: string) { }
}
