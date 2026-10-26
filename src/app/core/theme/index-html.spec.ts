import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Theme } from './theme';
import { DARK_MODE_CLASS, DARK_SCHEME_QUERY, THEME_STORAGE_KEY } from './theme.constants';

/**
 * `index.html` runs a plain script before the first paint, so it cannot import our constants.
 * These tests keep it from drifting away from them.
 */
const html = readFileSync(join(process.cwd(), 'src', 'index.html'), 'utf8');
const script = /<script>([\s\S]*?)<\/script>/.exec(html)?.[1] ?? '';

/** Stands for storage that throws (private mode, blocked cookies). */
const BLOCKED = '<storage blocked>' as const;

/** Runs the real inline script against a fake browser and reports whether it set the dark class. */
function runScript(saved: string | null | typeof BLOCKED, systemDark: boolean): boolean {
  const classes = new Set<string>();
  const fakeWindow = { matchMedia: () => ({ matches: systemDark }) };
  const fakeDocument = {
    documentElement: { classList: { add: (name: string) => classes.add(name) } },
  };
  const storage = {
    getItem: () => {
      if (saved === BLOCKED) {
        throw new Error('denied');
      }
      return saved;
    },
  };
  new Function('localStorage', 'window', 'document', script)(storage, fakeWindow, fakeDocument);
  return classes.has(DARK_MODE_CLASS);
}

describe('src/index.html pre-paint theme script', () => {
  it('exists and is inline (no extra request before the first paint)', () => {
    expect(script.trim()).not.toBe('');
  });

  it('reads the same storage key as the Theme service', () => {
    expect(script).toContain(`localStorage.getItem('${THEME_STORAGE_KEY}')`);
  });

  it('sets the same class that switches PrimeNG to dark', () => {
    expect(script).toContain(`classList.add('${DARK_MODE_CLASS}')`);
  });

  it('uses the same system-preference query', () => {
    expect(script).toContain(`matchMedia('${DARK_SCHEME_QUERY}')`);
  });

  it('never throws if storage is blocked', () => {
    expect(script).toMatch(/try\s*{[\s\S]*}\s*catch/);
  });

  it('declares both color schemes so native controls follow the theme', () => {
    expect(html).toContain('<meta name="color-scheme" content="light dark" />');
  });

  describe('behavior', () => {
    it('applies the dark class for a saved dark choice and for a dark system, and leaves light alone', () => {
      expect(runScript('dark', false)).toBe(true);
      expect(runScript('light', true)).toBe(false);
      expect(runScript(null, true)).toBe(true);
      expect(runScript(null, false)).toBe(false);
    });

    it('falls back to the system preference when storage is blocked, instead of staying light', () => {
      expect(runScript(BLOCKED, true)).toBe(true);
      expect(runScript(BLOCKED, false)).toBe(false);
    });

    it.each([['neon'], ['Dark'], [' dark'], ['']])(
      'ignores an invalid saved value (%j) and uses the system preference',
      (saved) => {
        expect(runScript(saved, true)).toBe(true);
        expect(runScript(saved, false)).toBe(false);
      },
    );

    it('stays light, without throwing, when the system preference cannot be read', () => {
      const classes = new Set<string>();
      const document = {
        documentElement: { classList: { add: (name: string) => classes.add(name) } },
      };
      const window = {
        matchMedia: () => {
          throw new Error('unsupported');
        },
      };

      expect(() =>
        new Function('localStorage', 'window', 'document', script)(
          { getItem: () => null },
          window,
          document,
        ),
      ).not.toThrow();
      expect(classes.size).toBe(0);
    });
  });

  describe('decides exactly like the Theme service, for every combination', () => {
    afterEach(() => {
      vi.restoreAllMocks();
      Reflect.deleteProperty(window, 'matchMedia');
      document.documentElement.classList.remove(DARK_MODE_CLASS);
    });

    const saved = [null, 'light', 'dark', 'neon', '', 'Dark', ' dark', BLOCKED] as const;
    const cases = saved.flatMap((value) =>
      [false, true].map((systemDark) => [value, systemDark] as const),
    );

    it.each(cases)('saved=%j, system dark=%s', (value, systemDark) => {
      Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        value: (query: string) => ({ matches: systemDark, media: query }) as MediaQueryList,
      });
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        if (value === BLOCKED) {
          throw new DOMException('denied', 'SecurityError');
        }
        return value;
      });
      TestBed.configureTestingModule({
        providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
      });
      const theme = TestBed.inject(Theme);

      theme.init();

      expect(theme.isDark()).toBe(runScript(value, systemDark));
    });
  });
});
