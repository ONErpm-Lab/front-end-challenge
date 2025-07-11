import { Component } from '@angular/core';

import { IsrcSearchComponent } from './components/isrc-search/isrc-search.component';
import { LoadingSpinnerComponent } from './components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-root',
  imports: [IsrcSearchComponent, LoadingSpinnerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'front-end-challenge';
}
