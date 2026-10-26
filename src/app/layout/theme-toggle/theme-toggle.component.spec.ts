import { TestBed } from '@angular/core/testing';
import { ThemeService } from '../../core/theme/theme.service';
import { THEME_ATTRIBUTE } from '../../core/theme/theme.constants';
import { i18nTestProviders, useLanguage } from '../../../testing/i18n-testing';
import { ThemeToggleComponent } from './theme-toggle.component';

describe('ThemeToggle', () => {
  afterEach(() => document.documentElement.removeAttribute(THEME_ATTRIBUTE));

  it('says what it will do, and does it', async () => {
    document.documentElement.setAttribute(THEME_ATTRIBUTE, 'light');
    TestBed.configureTestingModule({ providers: [...i18nTestProviders] });
    await useLanguage();
    const fixture = TestBed.createComponent(ThemeToggleComponent);
    await fixture.whenStable();
    const button = (fixture.nativeElement as HTMLElement).querySelector(
      'button',
    ) as HTMLButtonElement;

    expect(button.getAttribute('aria-label')).toBe('Switch to the dark theme');

    button.click();
    await fixture.whenStable();

    expect(TestBed.inject(ThemeService).isDark()).toBe(true);
    expect(button.getAttribute('aria-label')).toBe('Switch to the light theme');
  });
});
