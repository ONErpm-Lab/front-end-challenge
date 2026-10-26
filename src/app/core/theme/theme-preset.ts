import { definePreset } from '@primeuix/themes';
import base from '@primeuix/themes/aura/base';
import button from '@primeuix/themes/aura/button';
import css from '@primeuix/themes/aura/css';
import dialog from '@primeuix/themes/aura/dialog';
import iconfield from '@primeuix/themes/aura/iconfield';
import inputtext from '@primeuix/themes/aura/inputtext';
import message from '@primeuix/themes/aura/message';
import select from '@primeuix/themes/aura/select';
import skeleton from '@primeuix/themes/aura/skeleton';
import tag from '@primeuix/themes/aura/tag';
import {
  ACCENT_PALETTE,
  ACTION_COLORS,
  PLAY_BUTTON_COLORS,
  SURFACE_PALETTE,
} from './theme.constants';

/**
 * Aura, but only the components the page uses (`primeng/*` imports in `src/app`): the whole preset carries the
 * tokens of some ninety components, about 100 kB of the initial bundle. A PrimeNG component added later needs its
 * tokens here (`@primeuix/themes/aura/<component>`), or it renders without a theme.
 */
const AuraSubset = {
  ...base,
  components: { button, dialog, iconfield, inputtext, message, select, skeleton, tag },
  // The package declares a named export, but at runtime `aura/css` is a string, the default export (as Aura itself uses it).
  css: css as unknown as string,
};

/**
 * Aura with our accent and ink surfaces; light and dark keep AA contrast (see `ACCENT_PALETTE`).
 *
 * Aura's light message and outlined-button texts use the 500/600 steps of red, yellow and green on
 * very pale backgrounds, which measure 2.5:1 to 3.7:1 (axe flagged them). The light scheme moves
 * them to darker steps; the dark scheme already passes.
 */
export const OnerpmPreset = definePreset(AuraSubset, {
  semantic: {
    primary: ACCENT_PALETTE,
    colorScheme: {
      light: {
        surface: SURFACE_PALETTE,
        action: ACTION_COLORS.light,
        play: PLAY_BUTTON_COLORS,
        primary: {
          color: '{primary.700}',
          contrastColor: '#ffffff',
          hoverColor: '{primary.800}',
          activeColor: '{primary.900}',
        },
        highlight: {
          background: '{primary.50}',
          focusBackground: '{primary.100}',
          color: '{primary.800}',
          focusColor: '{primary.900}',
        },
      },
      dark: {
        surface: SURFACE_PALETTE,
        action: ACTION_COLORS.dark,
        play: PLAY_BUTTON_COLORS,
        primary: {
          color: '{primary.400}',
          contrastColor: '{surface.950}',
          hoverColor: '{primary.300}',
          activeColor: '{primary.200}',
        },
        highlight: {
          background: 'color-mix(in srgb, {primary.400}, transparent 84%)',
          focusBackground: 'color-mix(in srgb, {primary.400}, transparent 76%)',
          color: 'rgba(255,255,255,.87)',
          focusColor: 'rgba(255,255,255,.87)',
        },
      },
    },
  },
  components: {
    message: {
      colorScheme: {
        light: {
          error: { color: '{red.700}' },
          warn: { color: '{yellow.800}' },
          success: { color: '{green.700}' },
        },
        // Aura's dark red (500) on its 16% red tint over the card measures 4.47:1, just under AA.
        dark: {
          error: { color: '{red.400}' },
        },
      },
    },
    button: {
      colorScheme: {
        light: {
          outlined: { danger: { color: '{red.700}' } },
        },
      },
    },
  },
});
