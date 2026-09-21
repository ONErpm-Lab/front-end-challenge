import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Presentational loading indicator. */
@Component({
  selector: 'onerpm-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center justify-center gap-3 p-6" role="status">
      <span
        class="size-5 animate-spin rounded-full border-2 border-current border-t-transparent"
        aria-hidden="true"
      ></span>
      <span class="text-sm">{{ label() }}</span>
    </div>
  `,
})
export class Spinner {
  readonly label = input('Carregando...');
}
