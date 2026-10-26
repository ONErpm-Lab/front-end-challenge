/** `localStorage` key holding the visitor's explicit choice (also read by the script in `index.html`). */
export const THEME_STORAGE_KEY = 'orp.theme';

/** Class on `<html>` that switches PrimeNG, and our own tokens, to the dark color scheme. */
export const DARK_MODE_CLASS = 'app-dark';

export const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)';

/**
 * Accent: a stage-light orange. These are our own brand-inspired tokens, not an official ONErpm
 * palette: swap this one scale (and the surface scale below) to rebrand the whole page.
 * Contrast (WCAG AA): `700` carries white text in the light theme (5.5:1) and `400` carries dark
 * text in the dark theme (7.5:1).
 */
export const ACCENT_PALETTE = {
  50: '#fff4ed',
  100: '#ffe6d4',
  200: '#ffc9a8',
  300: '#ffa370',
  400: '#ff7a38',
  500: '#ff5a1f',
  600: '#e8420f',
  700: '#c23410',
  800: '#9a2c12',
  900: '#7c2713',
  950: '#431108',
} as const;

/** Neutral "ink" surfaces with a faint violet cast; `950` is the dark theme's page background. */
export const SURFACE_PALETTE = {
  0: '#ffffff',
  50: '#f7f7f9',
  100: '#eeeef2',
  200: '#dcdce4',
  300: '#c1c1cd',
  400: '#9696a8',
  500: '#6b6b80',
  600: '#4d4d5f',
  700: '#373745',
  800: '#24242f',
  900: '#16161e',
  950: '#0c0c11',
} as const;

/**
 * The page's call-to-action (`ActionButton`), in the look of Spotify's "Listen on" badges: black on the
 * light theme, white on the dark one, with Spotify's mark in its green on black and black on white. They
 * become the `--p-action-*` variables, switched by the same `app-dark` class as every other token.
 */
export const ACTION_COLORS = {
  light: {
    background: '#121212',
    hoverBackground: '#000000',
    color: '#ffffff',
    spotify: '#1ed760',
  },
  dark: {
    background: '#ffffff',
    hoverBackground: '#e8e8e8',
    color: '#121212',
    spotify: '#121212',
  },
} as const;

/**
 * The play button that rises over a card's cover on hover, as on Spotify: its green with black ink (10:1),
 * the same in both color schemes (the cover behind it can be anything). They become `--p-play-*`.
 */
export const PLAY_BUTTON_COLORS = {
  background: '#1ed760',
  hoverBackground: '#3be477',
  color: '#000000',
} as const;

/** CSS layers: PrimeNG's styles sit below ours, so our rules win without `!important`. */
export const PRIMENG_CSS_LAYER = { name: 'primeng', order: 'theme, base, primeng' } as const;
