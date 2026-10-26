import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';
import { SafeStorage } from '../storage/safe-storage';
import { DARK_MODE_CLASS, DARK_SCHEME_QUERY, THEME_STORAGE_KEY } from './theme.constants';
import { ThemeMode } from './theme.enums';

/**
 * Light or dark theme. Saved choice first, then the system preference. The class is also set by a
 * tiny script in `index.html` before the first paint, so dark-mode visitors never see a white flash;
 * this service only keeps it in sync afterwards.
 */
@Injectable({ providedIn: 'root' })
export class Theme {
  private readonly _document = inject(DOCUMENT);
  private readonly _storage = inject(SafeStorage);
  private readonly _mode = signal(ThemeMode.LIGHT);

  public readonly mode = this._mode.asReadonly();
  public readonly isDark = computed(() => this._mode() === ThemeMode.DARK);

  public init(): void {
    this._apply(this._detect());
  }

  /** Switches theme and remembers the choice. */
  public setMode(mode: ThemeMode): void {
    this._apply(mode);
    this._storage.write(THEME_STORAGE_KEY, mode);
  }

  public toggle(): void {
    this.setMode(this.isDark() ? ThemeMode.LIGHT : ThemeMode.DARK);
  }

  private _detect(): ThemeMode {
    const stored = toThemeMode(this._storage.read(THEME_STORAGE_KEY));
    if (stored) {
      return stored;
    }
    const prefersDark =
      this._document.defaultView?.matchMedia?.(DARK_SCHEME_QUERY).matches ?? false;
    return prefersDark ? ThemeMode.DARK : ThemeMode.LIGHT;
  }

  private _apply(mode: ThemeMode): void {
    this._document.documentElement.classList.toggle(DARK_MODE_CLASS, mode === ThemeMode.DARK);
    this._mode.set(mode);
  }
}

/** A stored value that is not a known mode is ignored rather than trusted. */
export function toThemeMode(value: string | null): ThemeMode | null {
  return Object.values(ThemeMode).find((mode) => mode === value) ?? null;
}
