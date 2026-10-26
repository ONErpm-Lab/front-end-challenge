import {
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
} from '@angular/core';
import { providePrimeNG } from 'primeng/config';
import { DARK_MODE_CLASS, PRIMENG_CSS_LAYER } from './theme.constants';
import { OnerpmPreset } from './theme-preset';
import { Theme } from './theme';

/** PrimeNG with our preset (dark mode driven by a class on `<html>`) and the theme startup step. */
export function provideTheme(): EnvironmentProviders {
  return makeEnvironmentProviders([
    providePrimeNG({
      theme: {
        preset: OnerpmPreset,
        options: {
          darkModeSelector: `.${DARK_MODE_CLASS}`,
          cssLayer: PRIMENG_CSS_LAYER,
        },
      },
    }),
    provideAppInitializer(() => inject(Theme).init()),
  ]);
}
