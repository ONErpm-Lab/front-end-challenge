import { TestBed } from '@angular/core/testing';
import { THEME_ATTRIBUTE, THEME_STORAGE_KEY } from './theme.constants';
import { ThemeMode } from './theme.enums';
import { ThemeService } from './theme.service';

/** jsdom has no `matchMedia`: give the page a system preference. */
function prefersDark(matches: boolean): void {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: () => ({ matches }) as MediaQueryList,
  });
}

describe('Theme', () => {
  afterEach(() => {
    document.documentElement.removeAttribute(THEME_ATTRIBUTE);
    vi.restoreAllMocks();
  });

  it('starts from the scheme the startup script applied', () => {
    document.documentElement.setAttribute(THEME_ATTRIBUTE, 'dark');

    expect(TestBed.inject(ThemeService).isDark()).toBe(true);
  });

  it('falls back to the system scheme when nothing was applied', () => {
    prefersDark(true);

    expect(TestBed.inject(ThemeService).mode()).toBe(ThemeMode.DARK);
  });

  it('is light when the system has no preference', () => {
    prefersDark(false);

    expect(TestBed.inject(ThemeService).mode()).toBe(ThemeMode.LIGHT);
  });

  it('toggles, applies the scheme to the page and remembers it', () => {
    document.documentElement.setAttribute(THEME_ATTRIBUTE, 'light');
    const theme = TestBed.inject(ThemeService);

    theme.toggle();

    expect(theme.isDark()).toBe(true);
    expect(document.documentElement.getAttribute(THEME_ATTRIBUTE)).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    theme.toggle();
    expect(theme.mode()).toBe(ThemeMode.LIGHT);
  });
});
