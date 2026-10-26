import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';

/**
 * `localStorage` that never throws. It can be missing (server render) or fail (private mode,
 * blocked cookies, full quota), and the page must keep working in all of those cases: a
 * preference that cannot be saved still applies to the current visit.
 */
@Injectable({ providedIn: 'root' })
export class SafeStorageService {
  private readonly _isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  public read(key: string): string | null {
    if (!this._isBrowser) {
      return null;
    }
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  public write(key: string, value: string): void {
    if (!this._isBrowser) {
      return;
    }
    try {
      localStorage.setItem(key, value);
    } catch {
      // Not persisted this time.
    }
  }
}
