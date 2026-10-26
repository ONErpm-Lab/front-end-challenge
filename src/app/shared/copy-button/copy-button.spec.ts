import { Clipboard } from '@angular/cdk/clipboard';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CopyButton } from './copy-button';
import { COPY_FEEDBACK_MS } from './copy-button';

interface Inputs {
  value?: string;
  caption?: string;
}

async function render(inputs: Inputs = {}, copies = true) {
  const copy = vi.fn(() => copies);
  TestBed.configureTestingModule({
    imports: [CopyButton],
    providers: [{ provide: Clipboard, useValue: { copy } }],
  });
  const fixture = TestBed.createComponent(CopyButton);
  fixture.componentRef.setInput('value', inputs.value ?? 'BR1SP1200071');
  fixture.componentRef.setInput('label', 'Copy ISRC BR1SP1200071');
  fixture.componentRef.setInput('copiedLabel', 'Copied');
  if (inputs.caption !== undefined) {
    fixture.componentRef.setInput('caption', inputs.caption);
  }
  await fixture.whenStable();
  return { fixture, copy };
}

const root = (fixture: ComponentFixture<CopyButton>) => fixture.nativeElement as HTMLElement;
const button = (fixture: ComponentFixture<CopyButton>) =>
  root(fixture).querySelector('button') as HTMLButtonElement;
const status = (fixture: ComponentFixture<CopyButton>) =>
  root(fixture).querySelector('[role="status"]')?.textContent?.trim();
const icon = (fixture: ComponentFixture<CopyButton>) => root(fixture).querySelector('i')?.className;
const settle = async (fixture: ComponentFixture<CopyButton>) => {
  await fixture.whenStable();
  fixture.detectChanges();
};

describe('CopyButton', () => {
  describe('icon only', () => {
    it('is a button named by its label, with the same text as a tooltip', async () => {
      const { fixture } = await render();

      expect(button(fixture).type).toBe('button');
      expect(button(fixture).getAttribute('aria-label')).toBe('Copy ISRC BR1SP1200071');
      expect(button(fixture).title).toBe('Copy ISRC BR1SP1200071');
      expect(button(fixture).textContent?.trim()).toBe('');
    });

    it('shows the copy icon, hidden from assistive technology', async () => {
      const { fixture } = await render();

      expect(icon(fixture)).toContain('pi-copy');
      expect(root(fixture).querySelector('i')?.getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('with a caption', () => {
    it('shows it, and is named by it', async () => {
      const { fixture } = await render({ caption: 'Copy all' });

      expect(button(fixture).textContent?.trim()).toBe('Copy all');
      expect(button(fixture).getAttribute('aria-label')).toBeNull();
      expect(button(fixture).classList).toContain('copy--captioned');
    });

    it('says "Copied" in place of the caption after copying', async () => {
      const { fixture } = await render({ caption: 'Copy all' });

      button(fixture).click();
      await settle(fixture);

      expect(button(fixture).textContent?.trim()).toBe('Copied');
    });
  });

  describe('copying', () => {
    it('puts the value on the clipboard', async () => {
      const { fixture, copy } = await render({ value: 'XX1AA0000001' });

      button(fixture).click();

      expect(copy).toHaveBeenCalledExactlyOnceWith('XX1AA0000001');
    });

    it('emits `copied`', async () => {
      const { fixture } = await render();
      const copied = vi.fn();
      fixture.componentInstance.copied.subscribe(copied);

      button(fixture).click();

      expect(copied).toHaveBeenCalledTimes(1);
    });

    it('shows the check mark and announces "Copied"', async () => {
      const { fixture } = await render();
      expect(status(fixture)).toBe('');

      button(fixture).click();
      await settle(fixture);

      expect(icon(fixture)).toContain('pi-check');
      expect(status(fixture)).toBe('Copied');
    });

    it('goes back to the copy icon after a moment', async () => {
      const { fixture } = await render();
      vi.useFakeTimers();
      try {
        button(fixture).click();
        fixture.detectChanges();
        expect(icon(fixture)).toContain('pi-check');

        await vi.advanceTimersByTimeAsync(COPY_FEEDBACK_MS);
        fixture.detectChanges();

        expect(icon(fixture)).toContain('pi-copy');
        expect(status(fixture)).toBe('');
      } finally {
        vi.useRealTimers();
      }
    });

    it('starts the moment over when it is clicked again', async () => {
      const { fixture } = await render();
      vi.useFakeTimers();
      try {
        button(fixture).click();
        await vi.advanceTimersByTimeAsync(COPY_FEEDBACK_MS - 100);
        button(fixture).click();
        await vi.advanceTimersByTimeAsync(COPY_FEEDBACK_MS - 100);
        fixture.detectChanges();

        expect(icon(fixture)).toContain('pi-check');

        await vi.advanceTimersByTimeAsync(100);
        fixture.detectChanges();
        expect(icon(fixture)).toContain('pi-copy');
      } finally {
        vi.useRealTimers();
      }
    });

    it('says nothing, and emits nothing, when the browser refuses to copy', async () => {
      const { fixture } = await render({}, false);
      const copied = vi.fn();
      fixture.componentInstance.copied.subscribe(copied);

      button(fixture).click();
      await settle(fixture);

      expect(icon(fixture)).toContain('pi-copy');
      expect(status(fixture)).toBe('');
      expect(copied).not.toHaveBeenCalled();
    });

    it('cancels its timer when it is destroyed', async () => {
      const { fixture } = await render();
      vi.useFakeTimers();
      try {
        button(fixture).click();
        const cancel = vi.spyOn(globalThis, 'clearTimeout');

        fixture.destroy();

        expect(cancel).toHaveBeenCalled();
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
