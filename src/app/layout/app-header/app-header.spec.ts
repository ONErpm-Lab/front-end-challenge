import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Language } from '../../core/i18n/i18n.enums';
import { i18nTestProviders, useLanguage } from '../../testing/i18n-testing';
import { LanguageSelect } from '../language-select/language-select';
import { ThemeToggle } from '../theme-toggle/theme-toggle';
import { AppHeader } from './app-header';

async function render(language = Language.EN): Promise<ComponentFixture<AppHeader>> {
  TestBed.configureTestingModule({ imports: [AppHeader], providers: i18nTestProviders });
  await useLanguage(language);
  const fixture = TestBed.createComponent(AppHeader);
  await fixture.whenStable();
  return fixture;
}

describe('AppHeader', () => {
  beforeEach(() => localStorage.clear());

  it('is the page banner landmark', async () => {
    const fixture = await render();

    expect(fixture.nativeElement.querySelector('header')).not.toBeNull();
  });

  it('shows the product label, translated', async () => {
    const english = await render(Language.EN);
    expect(english.nativeElement.querySelector('.brand__name')?.textContent).toBe('ISRC lookup');
    TestBed.resetTestingModule();

    const turkish = await render(Language.TR);
    expect(turkish.nativeElement.querySelector('.brand__name')?.textContent).toBe('ISRC sorgusu');
  });

  it('hides the decorative logo from assistive technology', async () => {
    const fixture = await render();

    const mark = fixture.nativeElement.querySelector('svg.brand__mark') as SVGElement;

    expect(mark.getAttribute('aria-hidden')).toBe('true');
    expect(mark.getAttribute('focusable')).toBe('false');
  });

  it('offers the language and the theme controls, language first', async () => {
    const fixture = await render();

    const controls = fixture.debugElement
      .queryAll(By.css('.actions > *'))
      .map((element) => element.name);

    expect(fixture.debugElement.query(By.directive(LanguageSelect))).not.toBeNull();
    expect(fixture.debugElement.query(By.directive(ThemeToggle))).not.toBeNull();
    expect(controls).toEqual(['orp-language-select', 'orp-theme-toggle']);
  });
});
