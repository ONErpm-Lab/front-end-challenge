import { DOCUMENT } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Theme, toThemeMode } from './theme';
import { DARK_MODE_CLASS, THEME_STORAGE_KEY } from './theme.constants';
import { ThemeMode } from './theme.enums';

/** jsdom has no `matchMedia`: the test supplies one that answers the dark-scheme query. */
function stubMatchMedia(prefersDark: boolean): void {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string) => ({ matches: prefersDark, media: query }) as MediaQueryList,
  });
}

function setup(options: { prefersDark?: boolean; platform?: 'browser' | 'server' } = {}) {
  const { prefersDark = false, platform = 'browser' } = options;
  stubMatchMedia(prefersDark);
  TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: platform }] });
  return TestBed.inject(Theme);
}

const isDarkClassSet = () => document.documentElement.classList.contains(DARK_MODE_CLASS);

describe('Theme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove(DARK_MODE_CLASS);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(window, 'matchMedia');
  });

  describe('init', () => {
    it('is light when nothing is saved and the system prefers light', () => {
      const theme = setup({ prefersDark: false });

      theme.init();

      expect(theme.mode()).toBe(ThemeMode.LIGHT);
      expect(theme.isDark()).toBe(false);
      expect(isDarkClassSet()).toBe(false);
    });

    it('follows a dark system preference', () => {
      const theme = setup({ prefersDark: true });

      theme.init();

      expect(theme.mode()).toBe(ThemeMode.DARK);
      expect(isDarkClassSet()).toBe(true);
    });

    it('prefers the saved choice over the system: a saved light theme beats a dark system', () => {
      localStorage.setItem(THEME_STORAGE_KEY, 'light');
      const theme = setup({ prefersDark: true });

      theme.init();

      expect(theme.mode()).toBe(ThemeMode.LIGHT);
      expect(isDarkClassSet()).toBe(false);
    });

    it('prefers the saved choice over the system: a saved dark theme beats a light system', () => {
      localStorage.setItem(THEME_STORAGE_KEY, 'dark');
      const theme = setup({ prefersDark: false });

      theme.init();

      expect(theme.mode()).toBe(ThemeMode.DARK);
      expect(isDarkClassSet()).toBe(true);
    });

    it('ignores a saved value that is not a theme', () => {
      localStorage.setItem(THEME_STORAGE_KEY, 'neon');
      const theme = setup({ prefersDark: true });

      theme.init();

      expect(theme.mode()).toBe(ThemeMode.DARK);
    });

    it('removes a dark class that the pre-paint script set when the saved choice is light', () => {
      document.documentElement.classList.add(DARK_MODE_CLASS);
      localStorage.setItem(THEME_STORAGE_KEY, 'light');
      const theme = setup();

      theme.init();

      expect(isDarkClassSet()).toBe(false);
    });

    it('does not save what it only detected', () => {
      const theme = setup({ prefersDark: true });

      theme.init();

      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
    });

    it('falls back to light where there is no window to ask (server render)', () => {
      TestBed.configureTestingModule({
        providers: [
          { provide: PLATFORM_ID, useValue: 'server' },
          {
            provide: DOCUMENT,
            useValue: { documentElement: document.documentElement, defaultView: null },
          },
        ],
      });
      const theme = TestBed.inject(Theme);

      theme.init();

      expect(theme.mode()).toBe(ThemeMode.LIGHT);
    });

    it('ignores the saved choice on the server', () => {
      localStorage.setItem(THEME_STORAGE_KEY, 'dark');
      const theme = setup({ platform: 'server', prefersDark: false });

      theme.init();

      expect(theme.mode()).toBe(ThemeMode.LIGHT);
    });
  });

  describe('setMode and toggle', () => {
    it('applies the mode and remembers it', () => {
      const theme = setup();

      theme.setMode(ThemeMode.DARK);

      expect(theme.isDark()).toBe(true);
      expect(isDarkClassSet()).toBe(true);
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    });

    it('toggles back and forth, keeping class, signal and storage in step', () => {
      const theme = setup();
      theme.init();

      theme.toggle();
      expect([theme.mode(), isDarkClassSet(), localStorage.getItem(THEME_STORAGE_KEY)]).toEqual([
        ThemeMode.DARK,
        true,
        'dark',
      ]);

      theme.toggle();
      expect([theme.mode(), isDarkClassSet(), localStorage.getItem(THEME_STORAGE_KEY)]).toEqual([
        ThemeMode.LIGHT,
        false,
        'light',
      ]);
    });

    it('still applies the theme when it cannot be saved (private mode)', () => {
      const theme = setup();
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('denied', 'SecurityError');
      });

      expect(() => theme.setMode(ThemeMode.DARK)).not.toThrow();
      expect(theme.isDark()).toBe(true);
    });

    it('survives a reload: the next visit starts in the saved theme', () => {
      setup().setMode(ThemeMode.DARK);
      TestBed.resetTestingModule();

      const next = setup({ prefersDark: false });
      next.init();

      expect(next.mode()).toBe(ThemeMode.DARK);
    });
  });
});

describe('toThemeMode', () => {
  it.each([
    ['light', ThemeMode.LIGHT],
    ['dark', ThemeMode.DARK],
  ])('accepts %s', (value, expected) => {
    expect(toThemeMode(value)).toBe(expected);
  });

  it.each([[null], [''], ['Dark'], ['auto'], [' dark']])('rejects %j', (value) => {
    expect(toThemeMode(value)).toBeNull();
  });
});
