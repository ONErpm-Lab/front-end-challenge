import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { LayoutComponent } from '../../../../components/layout/layout.component';

@Component({
  selector: 'app-error-page',
  standalone: true,
  imports: [CommonModule, LayoutComponent],
  templateUrl: './error-page.component.html',
  styleUrls: ['./error-page.component.scss'],
})
export class ErrorPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  errorType: string = '';
  errorMessage: string = '';

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.errorType = params['type'] || 'general';
      this.errorMessage = params['message'] || 'Ocorreu um erro inesperado.';
    });
  }

  goToTracks(): void {
    this.router.navigate(['/tracks']);
  }
}
