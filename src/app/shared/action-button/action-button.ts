import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ACTION_ICON_PATHS } from './action-button.constants';
import { ActionIcon } from './action-button.enums';

/**
 * The page's call-to-action: a full-width pill with a mark and a label, black on the light theme and white
 * on the dark one. Without `href` it is a button that emits `pressed`; with `href` it is a link to another
 * site, opened in a new tab (`newTabLabel` tells screen readers so).
 */
@Component({
  selector: 'orp-action-button',
  imports: [NgTemplateOutlet],
  templateUrl: './action-button.html',
  styleUrl: './action-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionButton {
  public readonly label = input.required<string>();
  public readonly icon = input.required<ActionIcon>();
  /** When set, the action is a link to this address instead of a button. */
  public readonly href = input<string>();
  /** The "(opens in a new tab)" text announced after the label of a link. */
  public readonly newTabLabel = input<string>();
  /** This action is the one in effect (e.g. the track playing): marked for assistive technology and in color. */
  public readonly current = input(false);

  public readonly pressed = output<void>();

  protected readonly iconPath = computed(() => ACTION_ICON_PATHS[this.icon()] ?? '');
  /** The equalizer is drawn as bars that move; every other mark is a still path. */
  protected readonly animated = computed(() => this.icon() === ActionIcon.EQUALIZER);
  protected readonly iconName = computed(() => `action__mark--${this.icon()}`);
}
