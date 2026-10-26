import { Clipboard } from '@angular/cdk/clipboard';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Language } from '../../../../core/i18n/i18n.enums';
import { i18nTestProviders, useLanguage } from '../../../../testing/i18n-testing';
import { IsrcListDialog } from './isrc-list-dialog';

const ISRCS = ['XX1AA0000001', 'XX1AA0000002', 'XX1AA0000003'];

async function render(
  options: { language?: Language; retryable?: boolean; visible?: boolean } = {},
) {
  const copy = vi.fn(() => true);
  TestBed.configureTestingModule({
    imports: [IsrcListDialog],
    providers: [...i18nTestProviders, { provide: Clipboard, useValue: { copy } }],
  });
  await useLanguage(options.language);
  const fixture = TestBed.createComponent(IsrcListDialog);
  fixture.componentRef.setInput('isrcs', ISRCS);
  fixture.componentRef.setInput('title', 'Missing');
  fixture.componentRef.setInput('hint', 'Copy them');
  fixture.componentRef.setInput('listLabel', 'Missing ISRCs');
  fixture.componentRef.setInput('retryable', options.retryable ?? false);
  fixture.componentRef.setInput('visible', options.visible ?? true);
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, copy };
}

const dialog = () => document.body.querySelector('[role="dialog"]') as HTMLElement | null;
const text = (element: Element | null | undefined) =>
  element?.textContent?.replace(/\s+/g, ' ').trim();
const settle = async (fixture: ComponentFixture<IsrcListDialog>) => {
  await fixture.whenStable();
  fixture.detectChanges();
};
const buttons = () => [...(dialog()?.querySelectorAll('button') ?? [])] as HTMLButtonElement[];
const buttonNamed = (name: string) =>
  buttons().find((button) => (button.getAttribute('aria-label') ?? text(button)) === name);

describe('IsrcListDialog', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => document.body.querySelectorAll('p-dialog').forEach((d) => d.remove()));

  it('shows nothing while it is closed', async () => {
    await render({ visible: false });

    expect(dialog()).toBeNull();
  });

  it('is a dialog with the title, the hint and one entry per ISRC, in order', async () => {
    await render();

    expect(text(dialog())).toContain('Missing');
    expect(text(dialog())).toContain('Copy them');
    expect(
      [...(dialog()?.querySelectorAll('.affected__isrc') ?? [])].map((item) => text(item)),
    ).toEqual(ISRCS);
  });

  it('names the list, and makes it reachable by keyboard since a long one scrolls', async () => {
    await render();

    const list = dialog()?.querySelector('ul.affected__list') as HTMLElement;

    expect(list.getAttribute('aria-label')).toBe('Missing ISRCs');
    expect(list.getAttribute('tabindex')).toBe('0');
  });

  describe('copying', () => {
    it('has a button per ISRC, named after it, that copies that ISRC', async () => {
      const { copy } = await render();

      buttonNamed('Copy ISRC XX1AA0000002')?.click();

      expect(copy).toHaveBeenCalledExactlyOnceWith('XX1AA0000002');
    });

    it('has a "copy all" button that copies them one per line', async () => {
      const { copy } = await render();

      buttonNamed('Copy all')?.click();

      expect(copy).toHaveBeenCalledExactlyOnceWith('XX1AA0000001\nXX1AA0000002\nXX1AA0000003');
    });

    it('says it in the visitor language', async () => {
      await render({ language: Language.PT });

      expect(buttonNamed('Copiar o ISRC XX1AA0000001')).toBeDefined();
      expect(buttonNamed('Copiar todos')).toBeDefined();
    });
  });

  describe('retry', () => {
    it('is not offered unless the list is retryable', async () => {
      await render();

      expect(buttonNamed('Try again')).toBeUndefined();
    });

    it('is offered, and emits `retry`, when it is', async () => {
      const { fixture } = await render({ retryable: true });
      const retry = vi.fn();
      fixture.componentInstance.retry.subscribe(retry);

      buttonNamed('Try again')?.click();

      expect(retry).toHaveBeenCalledTimes(1);
    });
  });

  describe('closing', () => {
    it('closes from the close button, labelled in the visitor language', async () => {
      const { fixture } = await render({ language: Language.PT });
      const closed = vi.fn();
      fixture.componentInstance.closed.subscribe(closed);

      (dialog()?.querySelector('[aria-label="Fechar"]') as HTMLElement).click();
      await settle(fixture);

      expect(fixture.componentInstance.visible()).toBe(false);
      expect(closed).toHaveBeenCalled();
    });
  });

  it('follows the list it is given', async () => {
    const { fixture } = await render();

    fixture.componentRef.setInput('isrcs', ['YY1BB0000009']);
    await settle(fixture);

    expect(
      [...(dialog()?.querySelectorAll('.affected__isrc') ?? [])].map((item) => text(item)),
    ).toEqual(['YY1BB0000009']);
    expect(buttonNamed('Copy ISRC YY1BB0000009')).toBeDefined();
  });
});
