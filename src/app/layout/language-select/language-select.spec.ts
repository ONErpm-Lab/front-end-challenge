import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Select } from 'primeng/select';
import { I18n } from '../../core/i18n/i18n';
import { savedLanguage } from '../../testing/saved-language';
import { Language } from '../../core/i18n/i18n.enums';
import { i18nTestProviders, useLanguage } from '../../testing/i18n-testing';
import { LanguageSelect } from './language-select';

async function render(language = Language.EN): Promise<ComponentFixture<LanguageSelect>> {
  TestBed.configureTestingModule({ imports: [LanguageSelect], providers: i18nTestProviders });
  await useLanguage(language);
  const fixture = TestBed.createComponent(LanguageSelect);
  await fixture.whenStable();
  return fixture;
}

const select = (fixture: ComponentFixture<LanguageSelect>) =>
  fixture.debugElement.query(By.directive(Select));
const text = (fixture: ComponentFixture<LanguageSelect>) =>
  (fixture.nativeElement as HTMLElement).textContent?.trim();

describe('LanguageSelect', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('does not ask the browser to focus it on load (PrimeNG adds autofocus unless told not to)', async () => {
    const fixture = await render();

    expect(fixture.nativeElement.querySelector('[autofocus]')).toBeNull();
  });

  it('offers exactly the six languages, in the documented order', async () => {
    const fixture = await render();

    const options = select(fixture).componentInstance.options as { id: string }[];

    expect(options.map((option) => option.id)).toEqual(['en', 'pt', 'es', 'ru', 'fr', 'tr']);
  });

  it('writes every language name in its own language', async () => {
    const fixture = await render();

    const options = select(fixture).componentInstance.options as { label: string }[];

    expect(options.map((option) => option.label)).toEqual([
      'English',
      'Português',
      'Español',
      'Русский',
      'Français',
      'Türkçe',
    ]);
  });

  it('shows the current language', async () => {
    const fixture = await render(Language.RU);

    expect(text(fixture)).toBe('Русский');
  });

  it('tags the shown language with its own lang for screen readers (pt is pt-BR)', async () => {
    const fixture = await render(Language.PT);

    expect(fixture.nativeElement.querySelector('[lang="pt-BR"]')?.textContent).toBe('Português');
  });

  it('has an accessible name, translated', async () => {
    const english = await render(Language.EN);
    expect(
      english.nativeElement.querySelector('[role="combobox"]')?.getAttribute('aria-label'),
    ).toBe('Language');
    TestBed.resetTestingModule();

    const portuguese = await render(Language.PT);
    expect(
      portuguese.nativeElement.querySelector('[role="combobox"]')?.getAttribute('aria-label'),
    ).toBe('Idioma');
  });

  it('changes the language of the whole page, and remembers it, when one is chosen', async () => {
    const fixture = await render();
    const i18n = TestBed.inject(I18n);

    select(fixture).triggerEventHandler('onChange', { value: Language.FR });
    await vi.waitFor(() => expect(i18n.language()).toBe(Language.FR));
    await fixture.whenStable();

    expect(savedLanguage()).toBe('fr');
    expect(text(fixture)).toBe('Français');
  });

  it('relabels itself in the new language', async () => {
    const fixture = await render();

    select(fixture).triggerEventHandler('onChange', { value: Language.PT });
    await vi.waitFor(() => expect(TestBed.inject(I18n).language()).toBe(Language.PT));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('[role="combobox"]')?.getAttribute('aria-label'),
    ).toBe('Idioma');
  });

  describe('with a real option selection (open the list, click a language)', () => {
    // PrimeNG's overlay asks the window about media queries, which jsdom does not implement.
    beforeEach(() => {
      Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        value: (query: string) =>
          ({
            matches: false,
            media: query,
            addEventListener: () => undefined,
            removeEventListener: () => undefined,
          }) as unknown as MediaQueryList,
      });
    });
    afterEach(() => Reflect.deleteProperty(window, 'matchMedia'));

    /** The way a visitor does it: opens the list and clicks the option with that name. */
    async function choose(fixture: ComponentFixture<LanguageSelect>, name: string) {
      (fixture.nativeElement.querySelector('.p-select') as HTMLElement).click();
      await fixture.whenStable();
      fixture.detectChanges();
      const option = [...document.querySelectorAll('[role="option"]')].find(
        (candidate) => candidate.textContent?.trim() === name,
      ) as HTMLElement;
      option.click();
      await fixture.whenStable();
      fixture.detectChanges();
    }

    it('switches the page and shows the chosen language', async () => {
      const fixture = await render(Language.EN);
      const i18n = TestBed.inject(I18n);

      await choose(fixture, 'Русский');
      await vi.waitFor(() => expect(i18n.language()).toBe(Language.RU));
      fixture.detectChanges();

      expect(text(fixture)).toBe('Русский');
      expect(savedLanguage()).toBe('ru');
    });

    it('puts the picker back on the active language when the chosen one cannot be loaded', async () => {
      const fixture = await render(Language.ES);
      const i18n = TestBed.inject(I18n);
      const failing = vi.spyOn(i18n, 'setLanguage').mockRejectedValue(new Error('chunk failed'));

      await choose(fixture, 'Русский');
      await vi.waitFor(() => expect(failing).toHaveBeenCalledWith(Language.RU));
      await fixture.whenStable();
      fixture.detectChanges();

      expect(i18n.language()).toBe(Language.ES);
      expect(text(fixture)).toBe('Español');
      expect(savedLanguage()).not.toBe('ru');
    });
  });

  it('stays on the current language, quietly, when the chosen one cannot be loaded', async () => {
    const fixture = await render(Language.ES);
    const i18n = TestBed.inject(I18n);
    vi.spyOn(i18n, 'setLanguage').mockRejectedValue(new Error('chunk failed'));

    select(fixture).triggerEventHandler('onChange', { value: Language.RU });
    await fixture.whenStable();

    expect(i18n.language()).toBe(Language.ES);
  });
});
