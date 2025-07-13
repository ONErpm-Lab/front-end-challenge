import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  template: `
    <app-header></app-header>
    <main class="main">
      <router-outlet />
    </main>
    <app-footer></app-footer>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
        background-color: var(--gray-100);
      }

      .main {
        flex: 1;
        padding: 2rem 1rem;
        background-color: var(--gray-100);

        @media (min-width: 1024px) {
          padding: 1rem 8rem;
        }

        @media (min-width: 1440px) {
          padding: 1rem 16rem;
        }
      }
    `,
  ],
})
export class LayoutComponent {}
