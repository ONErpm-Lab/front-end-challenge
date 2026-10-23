import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-track-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'skeleton', 'aria-hidden': 'true' },
  template: `
    <div class="sk sk--art"></div>
    <div class="sk-body">
      <div class="sk sk--line sk--w80"></div>
      <div class="sk sk--line sk--w50"></div>
      <div class="sk sk--line sk--w65 sk--gap"></div>
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
      padding: 0.75rem 0.75rem 1rem;
      border-radius: var(--radius-lg);
      background: var(--surface);
    }
    .sk {
      border-radius: var(--radius-sm);
      background: linear-gradient(
        90deg,
        var(--surface-2) 0%,
        var(--surface-3) 50%,
        var(--surface-2) 100%
      );
      background-size: 200% 100%;
      animation: shimmer 1.4s ease-in-out infinite;
    }
    .sk--art {
      aspect-ratio: 1;
      border-radius: var(--radius-md);
    }
    .sk-body {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding-inline: 0.25rem;
    }
    .sk--line {
      height: 0.8rem;
    }
    .sk--w80 {
      width: 80%;
      height: 1rem;
    }
    .sk--w50 {
      width: 50%;
    }
    .sk--w65 {
      width: 65%;
    }
    .sk--gap {
      margin-top: 0.75rem;
    }
    @media (max-width: 639px) {
      :host {
        display: grid;
        grid-template-columns: 4.5rem 1fr;
        padding: 0.625rem;
        border-radius: var(--radius-md);
      }
      .sk--art {
        border-radius: var(--radius-sm);
      }
      .sk-body {
        padding: 0.25rem 0 0;
      }
    }
    @keyframes shimmer {
      from {
        background-position: 100% 0;
      }
      to {
        background-position: -100% 0;
      }
    }
  `,
})
export class TrackSkeletonComponent {}
