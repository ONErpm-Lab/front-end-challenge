import { TestBed } from '@angular/core/testing';
import { Language } from '../../core/i18n/i18n.enums';
import { i18nTestProviders, useLanguage } from '../../../testing/i18n-testing';
import { HeaderComponent } from './header.component';

async function render(language = Language.EN) {
  TestBed.configureTestingModule({ providers: [...i18nTestProviders] });
  await useLanguage(language);
  const fixture = TestBed.createComponent(HeaderComponent);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('HeaderComponent', () => {
  it('has the product name as a link home', async () => {
    const root = await render();

    const brand = root.querySelector('a.brand') as HTMLAnchorElement;
    expect(brand.getAttribute('href')).toBe('/');
    expect(brand.textContent?.trim()).toBe('ISRC lookup');
  });

  it('says where the visitor is, with the current page marked', async () => {
    const root = await render();

    const nav = root.querySelector('nav') as HTMLElement;
    expect(nav.getAttribute('aria-label')).toBe('Breadcrumb');
    expect(nav.querySelector('[aria-current="page"]')?.textContent?.trim()).toBe(
      'Producer contract',
    );
  });

  it('offers the language and the theme', async () => {
    const root = await render();

    expect(root.querySelector('orp-language-menu')).not.toBeNull();
    expect(root.querySelector('orp-theme-toggle')).not.toBeNull();
  });

  it('speaks the language of the visitor', async () => {
    const root = await render(Language.PT);

    expect(root.querySelector('a.brand')?.textContent?.trim()).toBe('Consulta de ISRC');
  });
});
