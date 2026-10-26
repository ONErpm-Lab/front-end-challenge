import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Language } from '../../core/i18n/i18n.enums';
import { i18nTestProviders, useLanguage } from '../../testing/i18n-testing';
import { AppFooter } from './app-footer';

async function render(language = Language.EN): Promise<ComponentFixture<AppFooter>> {
  TestBed.configureTestingModule({ imports: [AppFooter], providers: i18nTestProviders });
  await useLanguage(language);
  const fixture = TestBed.createComponent(AppFooter);
  await fixture.whenStable();
  return fixture;
}

const root = (fixture: ComponentFixture<AppFooter>) => fixture.nativeElement as HTMLElement;
const text = (element: Element | null | undefined) =>
  element?.textContent?.replace(/\s+/g, ' ').trim();
const links = (fixture: ComponentFixture<AppFooter>) =>
  [...root(fixture).querySelectorAll('a')] as HTMLAnchorElement[];

describe('AppFooter', () => {
  beforeEach(() => localStorage.clear());

  it('is the page footer landmark (contentinfo)', async () => {
    const fixture = await render();

    expect(root(fixture).querySelector('footer')).not.toBeNull();
  });

  it('credits the author by name, linking to the portfolio', async () => {
    const fixture = await render();

    const author = root(fixture).querySelector('a.footer__author') as HTMLAnchorElement;

    expect(text(author)).toContain('Alysson Mascarenhas');
    expect(author.href).toBe('https://alyssonmascarenhas.github.io/portfolio/');
  });

  it('says what it was developed for', async () => {
    const fixture = await render();

    expect(text(root(fixture))).toContain(
      'Developed for the ONErpm front-end technical challenge.',
    );
  });

  it('links to the source code', async () => {
    const fixture = await render();

    const source = links(fixture).find((link) => link.href.endsWith('/onerpm-challenge'));

    expect(source?.href).toBe('https://github.com/AlyssonMascarenhas/onerpm-challenge');
    expect(text(source)).toContain('Source code');
  });

  it('credits Spotify as the source of the track data', async () => {
    const fixture = await render();

    expect(text(root(fixture))).toContain('Track data from the Spotify Web API.');
  });

  describe('external links', () => {
    it('open in a new tab, safely, and say so to screen readers', async () => {
      const fixture = await render();

      expect(links(fixture)).toHaveLength(2);
      for (const link of links(fixture)) {
        expect(link.target).toBe('_blank');
        expect(link.rel).toBe('noopener noreferrer');
        expect(text(link.querySelector('.visually-hidden'))).toBe('(opens in a new tab)');
      }
    });

    it('hide their decorative icon and separators from assistive technology', async () => {
      const fixture = await render();

      expect(root(fixture).querySelector('i.pi-github')?.getAttribute('aria-hidden')).toBe('true');
      for (const separator of root(fixture).querySelectorAll('.footer__separator')) {
        expect(separator.getAttribute('aria-hidden')).toBe('true');
      }
    });
  });

  describe('translation', () => {
    it.each([
      [Language.PT, 'Desenvolvido para o desafio técnico de front-end da ONErpm.', 'Código-fonte'],
      [
        Language.ES,
        'Desarrollado para el desafío técnico de front-end de ONErpm.',
        'Código fuente',
      ],
      [Language.RU, 'Разработано для технического задания ONErpm по фронтенду.', 'Исходный код'],
      [Language.FR, "Développé pour le défi technique front-end d'ONErpm.", 'Code source'],
      [Language.TR, 'ONErpm ön yüz teknik görevi için geliştirildi.', 'Kaynak kodu'],
    ])('is translated (%s)', async (language, builtFor, sourceCode) => {
      const fixture = await render(language);

      expect(text(root(fixture))).toContain(builtFor);
      expect(text(root(fixture))).toContain(sourceCode);
    });

    it('never translates the author name', async () => {
      const fixture = await render(Language.RU);

      expect(text(root(fixture).querySelector('a.footer__author'))).toContain(
        'Alysson Mascarenhas',
      );
    });

    it('follows a language change while on screen', async () => {
      const fixture = await render();

      await useLanguage(Language.PT);
      await fixture.whenStable();
      fixture.detectChanges();

      expect(text(root(fixture))).toContain('Código-fonte');
    });
  });
});
