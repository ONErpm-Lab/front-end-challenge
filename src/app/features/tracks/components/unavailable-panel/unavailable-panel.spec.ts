import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Language } from '../../../../core/i18n/i18n.enums';
import { i18nTestProviders, useLanguage } from '../../../../testing/i18n-testing';
import { UnavailablePanel } from './unavailable-panel';

async function render(language = Language.EN): Promise<ComponentFixture<UnavailablePanel>> {
  TestBed.configureTestingModule({ imports: [UnavailablePanel], providers: i18nTestProviders });
  await useLanguage(language);
  const fixture = TestBed.createComponent(UnavailablePanel);
  await fixture.whenStable();
  return fixture;
}

const root = (fixture: ComponentFixture<UnavailablePanel>) => fixture.nativeElement as HTMLElement;

describe('UnavailablePanel', () => {
  beforeEach(() => localStorage.clear());

  it('is an alert with a title, a message and a way to try again', async () => {
    const fixture = await render();

    const alert = root(fixture).querySelector('[role="alert"]');

    expect(alert?.querySelector('h2')?.textContent?.trim()).not.toBe('');
    expect(alert?.querySelector('p')?.textContent?.trim()).not.toBe('');
    expect(alert?.querySelector('button')?.textContent?.trim()).toBe('Try again');
  });

  it('asks to try again when the button is pressed', async () => {
    const fixture = await render();
    const retry = vi.fn();
    fixture.componentInstance.retry.subscribe(retry);

    root(fixture).querySelector('button')?.click();

    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('speaks the visitor language', async () => {
    const fixture = await render(Language.PT);

    expect(root(fixture).querySelector('button')?.textContent?.trim()).toBe('Tentar novamente');
  });
});
