import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Language } from '../../core/i18n/i18n.enums';
import { DARK_MODE_CLASS, THEME_STORAGE_KEY } from '../../core/theme/theme.constants';
import { i18nTestProviders, useLanguage } from '../../testing/i18n-testing';
import { ThemeToggle } from './theme-toggle';

async function render(language = Language.EN): Promise<ComponentFixture<ThemeToggle>> {
  TestBed.configureTestingModule({ imports: [ThemeToggle], providers: i18nTestProviders });
  await useLanguage(language);
  const fixture = TestBed.createComponent(ThemeToggle);
  await fixture.whenStable();
  return fixture;
}

const button = (fixture: ComponentFixture<ThemeToggle>) =>
  fixture.nativeElement.querySelector('button') as HTMLButtonElement;

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove(DARK_MODE_CLASS);
  });

  it('does not ask the browser to focus it on load', async () => {
    const fixture = await render();

    expect(fixture.nativeElement.querySelector('[autofocus]')).toBeNull();
  });

  it('offers the dark theme while the page is light, with the moon icon', async () => {
    const fixture = await render();

    expect(button(fixture).getAttribute('aria-label')).toBe('Switch to the dark theme');
    expect(button(fixture).querySelector('.pi-moon')).not.toBeNull();
  });

  it('offers the light theme once dark, with the sun icon', async () => {
    const fixture = await render();

    button(fixture).click();
    await fixture.whenStable();

    expect(button(fixture).getAttribute('aria-label')).toBe('Switch to the light theme');
    expect(button(fixture).querySelector('.pi-sun')).not.toBeNull();
  });

  it('switches the whole page and remembers the choice', async () => {
    const fixture = await render();

    button(fixture).click();

    expect(document.documentElement.classList.contains(DARK_MODE_CLASS)).toBe(true);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });

  it('switches back to light on a second click', async () => {
    const fixture = await render();

    button(fixture).click();
    button(fixture).click();

    expect(document.documentElement.classList.contains(DARK_MODE_CLASS)).toBe(false);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('is a real button, reachable by keyboard', async () => {
    const fixture = await render();

    expect(button(fixture).tagName).toBe('BUTTON');
    expect(button(fixture).type).toBe('button');
    expect(button(fixture).tabIndex).toBeGreaterThanOrEqual(0);
  });

  it.each([
    [Language.PT, 'Mudar para o tema escuro'],
    [Language.ES, 'Cambiar al tema oscuro'],
    [Language.RU, 'Включить тёмную тему'],
    [Language.FR, 'Passer au thème sombre'],
    [Language.TR, 'Koyu temaya geç'],
  ])('labels the action in %s', async (language, expected) => {
    const fixture = await render(language);

    expect(button(fixture).getAttribute('aria-label')).toBe(expected);
  });

  it('follows a language change made while it is on screen', async () => {
    const fixture = await render(Language.EN);

    await useLanguage(Language.PT);
    await fixture.whenStable();

    expect(button(fixture).getAttribute('aria-label')).toBe('Mudar para o tema escuro');
  });
});
