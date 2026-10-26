import { Clipboard } from '@angular/cdk/clipboard';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { i18nTestProviders, useLanguage } from '../../../../../testing/i18n-testing';
import { text } from '../../testing/render-with-tracks';
import { IsrcListDialogComponent } from './isrc-list-dialog.component';
import { IsrcListDialogData } from './isrc-list-dialog.interfaces';

async function render(data: IsrcListDialogData) {
  const close = vi.fn();
  const copy = vi.fn(() => true);
  TestBed.configureTestingModule({
    providers: [
      ...i18nTestProviders,
      { provide: DIALOG_DATA, useValue: data },
      { provide: DialogRef, useValue: { close } },
      { provide: Clipboard, useValue: { copy } },
    ],
  });
  await useLanguage();
  const fixture = TestBed.createComponent(IsrcListDialogComponent);
  await fixture.whenStable();
  const root = fixture.nativeElement as HTMLElement;
  const button = (label: string) =>
    [...root.querySelectorAll('button')].find(
      (candidate) =>
        text(candidate)?.includes(label) || candidate.getAttribute('aria-label') === label,
    ) as HTMLButtonElement;
  return { root, close, copy, button };
}

const MISSING: IsrcListDialogData = {
  titleKey: 'list.missingTitle',
  hintKey: 'list.missingHint',
  isrcs: ['QZNJX2081700', 'QZNJX2078148'],
};

describe('IsrcListDialogComponent', () => {
  it('has the title (which names the dialog), the hint and every ISRC', async () => {
    const { root } = await render(MISSING);

    expect(text(root.querySelector('h2#isrc-dialog-title'))).toBe('ISRCs not in our database');
    expect(text(root.querySelector('.hint'))).toContain('Spotify has no track');
    expect([...root.querySelectorAll('li .mono')].map((item) => text(item))).toEqual(MISSING.isrcs);
  });

  it('copies one ISRC, or all of them one per line', async () => {
    const { button, copy } = await render(MISSING);

    button('Copy ISRC QZNJX2081700').click();
    button('Copy all').click();

    expect(copy).toHaveBeenNthCalledWith(1, 'QZNJX2081700');
    expect(copy).toHaveBeenNthCalledWith(2, 'QZNJX2081700\nQZNJX2078148');
  });

  it('closes on request', async () => {
    const { button, close } = await render(MISSING);

    button('Close').click();

    expect(close).toHaveBeenCalledTimes(1);
  });

  it('offers no retry when none is given', async () => {
    const { button } = await render(MISSING);

    expect(button('Try again')).toBeUndefined();
  });

  it('closes, then tries again, when a retry is given', async () => {
    const retry = vi.fn();
    const { button, close } = await render({ ...MISSING, retry });

    button('Try again').click();

    expect(close).toHaveBeenCalledTimes(1);
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
