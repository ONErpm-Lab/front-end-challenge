import { TestBed } from '@angular/core/testing';
import { I18nService } from '../../core/i18n/i18n.service';
import { Language } from '../../core/i18n/i18n.enums';
import { i18nTestProviders, useLanguage } from '../../../testing/i18n-testing';
import { savedLanguage } from '../../../testing/saved-language';
import { LanguageMenuComponent } from './language-menu.component';

async function render() {
  TestBed.configureTestingModule({ providers: [...i18nTestProviders] });
  await useLanguage(Language.EN);
  const fixture = TestBed.createComponent(LanguageMenuComponent);
  await fixture.whenStable();
  const root = fixture.nativeElement as HTMLElement;
  const trigger = root.querySelector('button') as HTMLButtonElement;
  return { fixture, root, trigger };
}

const items = () => [...document.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]')];

describe('LanguageMenu', () => {
  afterEach(() => document.querySelector('.cdk-overlay-container')?.replaceChildren());

  it('names the current language on its trigger', async () => {
    const { trigger } = await render();

    expect(trigger.textContent?.replace(/\s+/g, ' ').trim()).toBe('Language: English EN');
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
  });

  it('offers every language, written in its own language, with the current one checked', async () => {
    const { fixture, trigger } = await render();

    trigger.click();
    await fixture.whenStable();

    expect(items().map((item) => item.textContent?.trim())).toEqual([
      'English',
      'Português',
      'Español',
      'Русский',
      'Français',
      'Türkçe',
    ]);
    expect(items()[1].getAttribute('lang')).toBe('pt-BR');
    expect(items()[0].getAttribute('aria-checked')).toBe('true');
    expect(items()[1].getAttribute('aria-checked')).toBe('false');
  });

  it('switches to the chosen language and remembers it', async () => {
    const { fixture, trigger } = await render();
    trigger.click();
    await fixture.whenStable();

    items()[3].click();
    await vi.waitFor(() => expect(TestBed.inject(I18nService).language()).toBe(Language.RU));
    await fixture.whenStable();

    expect(savedLanguage()).toBe('ru');
    expect(trigger.textContent).toContain('Язык:');
    expect(trigger.textContent).toContain('Русский');
  });
});
