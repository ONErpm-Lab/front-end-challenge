import { IconName } from './icon.types';

/** The path data of each icon (24×24 grid, stroked). */
export const ICON_PATHS: Readonly<Record<IconName, readonly string[]>> = {
  search: ['M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z', 'm20 20-3.5-3.5'],
  'chevron-right': ['m9 6 6 6-6 6'],
  'chevron-down': ['m6 9 6 6 6-6'],
  globe: [
    'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
    'M3 12h18',
    'M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18',
  ],
  moon: ['M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z'],
  sun: [
    'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    'M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  ],
  copy: [
    'M11 9h7a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z',
    'M5 15V5a2 2 0 0 1 2-2h10',
  ],
  check: ['m5 12.5 4.5 4.5L19 7.5'],
  external: ['M14 4h6v6', 'm20 4-9 9', 'M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5'],
  sort: ['M7 4v16', 'm3 16 4 4 4-4', 'M14 6h7', 'M14 12h5', 'M14 18h3'],
  play: ['M7 4.5v15l12.5-7.5z'],
  close: ['M6 6l12 12', 'M18 6 6 18'],
  alert: ['M12 3 22 21H2z', 'M12 10v5', 'M12 18h.01'],
  retry: ['M20 11a8 8 0 1 0-2.3 5.7', 'M20 4v7h-7'],
  disc: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z'],
  'signal-off': ['M2 12h3l2-5 3 10 3-14 3 12 2-3h4', 'M3 21 21 3'],
};
