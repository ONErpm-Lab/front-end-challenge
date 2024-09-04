import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarHorizontalPosition, MatSnackBarVerticalPosition } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private horizontalPosition: MatSnackBarHorizontalPosition = 'center';
  private verticalPosition: MatSnackBarVerticalPosition = 'bottom';

  constructor(private snackBar: MatSnackBar) { }

  showWarning(message: string): void {
    this.snackBar.open(message, '', {
      horizontalPosition: this.horizontalPosition,
      verticalPosition: this.verticalPosition,
      duration: 3000,
      panelClass: ['warning-snackbar']
    });
  }

  showError(message: string): void {
    this.snackBar.open(message, '', {
      horizontalPosition: this.horizontalPosition,
      duration: 3000,
      verticalPosition: this.verticalPosition,
      panelClass: ['error-snackbar']
    });
  }
}
