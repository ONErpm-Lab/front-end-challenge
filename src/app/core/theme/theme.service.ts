import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';
import { SafeStorageService } from '../storage/safe-storage.service';
import { THEME_ATTRIBUTE, THEME_STORAGE_KEY } from './theme.constants';
import { ThemeMode } from './theme.enums';

/**
 * Light or dark. It starts from what `theme-init.js` already put on `<html>` (the saved choice, else the system's),
 * so Angular never repaints the page in another scheme; toggling saves the choice for the next visit.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _document = inject(DOCUMENT);
  private readonly _storage = inject(SafeStorageService);
  private readonly _mode = signal(this._initialMode());

  public readonly mode = this._mode.asReadonly();
  public readonly isDark = computed(() => this._mode() === ThemeMode.DARK);

  public toggle(): void {
    this.set(this.isDark() ? ThemeMode.LIGHT : ThemeMode.DARK);
  }

  public set(mode: ThemeMode): void {
    this._mode.set(mode);
    this._document.documentElement.setAttribute(THEME_ATTRIBUTE, mode);
    this._storage.write(THEME_STORAGE_KEY, mode);
  }

  private _initialMode(): ThemeMode {
    const applied = this._document.documentElement.getAttribute(THEME_ATTRIBUTE);
    if (applied === ThemeMode.DARK || applied === ThemeMode.LIGHT) {
      return applied;
    }
    const prefersDark = this._document.defaultView?.matchMedia?.(
      '(prefers-color-scheme: dark)',
    ).matches;
    return prefersDark ? ThemeMode.DARK : ThemeMode.LIGHT;
  }
}
