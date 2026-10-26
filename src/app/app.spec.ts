import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { Language } from './core/i18n/i18n.enums';
import { i18nTestProviders, useLanguage } from './testing/i18n-testing';

async function render(language = Language.EN) {
  TestBed.configureTestingModule({
    imports: [App],
    providers: [provideRouter([]), ...i18nTestProviders],
  });
  await useLanguage(language);
  const fixture = TestBed.createComponent(App);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('App', () => {
  beforeEach(() => localStorage.clear());

  it('hosts the router outlet inside the main landmark', async () => {
    const root = await render();

    expect(root.querySelector('main#main router-outlet')).not.toBeNull();
  });

  it('shows the footer right after the main content', async () => {
    const root = await render();

    const footer = root.querySelector('orp-app-footer footer');

    expect(footer).not.toBeNull();
    expect(root.querySelector('main')?.nextElementSibling?.tagName.toLowerCase()).toBe(
      'orp-app-footer',
    );
  });

  it('keeps the player bar after the footer, where it pins to the window without covering anything', async () => {
    const root = await render();

    expect(root.lastElementChild?.tagName.toLowerCase()).toBe('orp-player-bar');
    expect(root.querySelector('orp-app-footer')?.nextElementSibling).toBe(
      root.querySelector('orp-player-bar'),
    );
  });

  it('shows the header', async () => {
    const root = await render();

    expect(root.querySelector('orp-app-header header')).not.toBeNull();
  });

  describe('skip link', () => {
    it('is the first focusable element and points at the main landmark', async () => {
      const root = await render();

      const link = root.querySelector('a.skip-link') as HTMLAnchorElement;

      expect(link.getAttribute('href')).toBe('#main');
      expect(root.firstElementChild).toBe(link);
      expect(root.querySelector('#main')).not.toBeNull();
    });

    it('lets the main landmark receive focus', async () => {
      const root = await render();

      expect(root.querySelector('main')?.getAttribute('tabindex')).toBe('-1');
    });

    it.each([
      [Language.EN, 'Skip to content'],
      [Language.PT, 'Pular para o conteúdo'],
      [Language.RU, 'Перейти к содержимому'],
    ])('is translated (%s)', async (language, expected) => {
      const root = await render(language);

      expect(root.querySelector('a.skip-link')?.textContent).toBe(expected);
    });
  });
});
