import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type IconName =
  | 'play'
  | 'pause'
  | 'external'
  | 'sort'
  | 'refresh'
  | 'alert'
  | 'mute'
  | 'info'
  | 'search'
  | 'close';

const PATHS: Record<IconName, string> = {
  play: 'M8 5.14v13.72a1 1 0 0 0 1.52.85l10.8-6.86a1 1 0 0 0 0-1.7L9.52 4.3A1 1 0 0 0 8 5.14Z',
  pause: 'M7 4.5h3.2v15H7zM13.8 4.5H17v15h-3.2z',
  external: 'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
  sort: 'M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3',
  refresh: 'M20 11a8 8 0 1 0-2.34 5.66M20 4v7h-7',
  alert:
    'M12 8v5M12 16.5v.01M10.3 3.9 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z',
  mute: 'M11 5 6 9H3v6h3l5 4V5ZM22 9l-6 6M16 9l6 6',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 16v-4.5M12 8h.01',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-4-4',
  close: 'M6 6l12 12M18 6 6 18',
};

const FILLED: ReadonlySet<IconName> = new Set(['play', 'pause']);

@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'icon', 'aria-hidden': 'true' },
  template: `
    <svg viewBox="0 0 24 24" [attr.width]="size()" [attr.height]="size()">
      @if (filled()) {
        <path [attr.d]="path()" fill="currentColor" />
      } @else {
        <path
          [attr.d]="path()"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      line-height: 0;
    }
  `,
})
export class IconComponent {
  readonly name = input.required<IconName>();
  readonly size = input(20);

  protected path = () => PATHS[this.name()];
  protected filled = () => FILLED.has(this.name());
}
