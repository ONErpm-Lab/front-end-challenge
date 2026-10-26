import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Language } from '../../../../core/i18n/i18n.enums';
import { ReleaseDatePrecision } from '../../../../models/tracks.enums';
import { ReleaseDate } from '../../../../models/tracks.interfaces';
import { i18nTestProviders, useLanguage } from '../../../../../testing/i18n-testing';
import { ReleaseDatesComponent } from './release-dates.component';

const day = (value: string): ReleaseDate => ({ value, precision: ReleaseDatePrecision.DAY });
const ALBUM = day('2014-05-12');
const SINGLE = day('2014-07-28');

async function render(dates: readonly ReleaseDate[], shown = dates[0], language = Language.EN) {
  TestBed.configureTestingModule({ providers: [...i18nTestProviders] });
  await useLanguage(language);
  const fixture = TestBed.createComponent(ReleaseDatesComponent);
  fixture.componentRef.setInput('dates', dates);
  fixture.componentRef.setInput('shown', shown);
  await fixture.whenStable();
  return fixture;
}

const trigger = (fixture: ComponentFixture<ReleaseDatesComponent>) =>
  (fixture.nativeElement as HTMLElement).querySelector('button') as HTMLButtonElement | null;
const popover = () => document.querySelector<HTMLElement>('.cdk-overlay-container [role="dialog"]');

async function settle(fixture: ComponentFixture<ReleaseDatesComponent>): Promise<void> {
  await fixture.whenStable();
  await new Promise((resolve) => setTimeout(resolve));
}

describe('ReleaseDatesComponent', () => {
  afterEach(() => document.querySelector('.cdk-overlay-container')?.replaceChildren());

  it('shows nothing when Spotify has a single date', async () => {
    const fixture = await render([ALBUM]);

    expect(trigger(fixture)).toBeNull();
  });

  it('warns how many dates were found, as a closed button', async () => {
    const fixture = await render([ALBUM, SINGLE]);

    const button = trigger(fixture) as HTMLButtonElement;
    expect(button.textContent?.trim()).toBe('2 dates found');
    expect(button.classList).toContain('badge--warn');
    expect(button.getAttribute('aria-haspopup')).toBe('dialog');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(popover()).toBeNull();
  });

  it('opens the dates on click, the shown one marked, with the focus in the popover', async () => {
    const fixture = await render([ALBUM, SINGLE], ALBUM);

    trigger(fixture)?.click();
    await settle(fixture);

    const dialog = popover() as HTMLElement;
    expect(dialog.getAttribute('aria-label')).toBe('Release dates found');
    expect(trigger(fixture)?.getAttribute('aria-expanded')).toBe('true');
    expect(trigger(fixture)?.getAttribute('aria-controls')).toBe(dialog.id);
    expect([...dialog.querySelectorAll('li')].map((item) => item.textContent?.trim())).toEqual([
      'May 12, 2014 shown',
      'July 28, 2014',
    ]);
    expect(document.activeElement).toBe(dialog);
  });

  it('closes on a second click', async () => {
    const fixture = await render([ALBUM, SINGLE]);

    trigger(fixture)?.click();
    await settle(fixture);
    trigger(fixture)?.click();
    await settle(fixture);

    expect(popover()).toBeNull();
    expect(trigger(fixture)?.getAttribute('aria-expanded')).toBe('false');
  });

  it('closes on Escape and gives the focus back to the button', async () => {
    const fixture = await render([ALBUM, SINGLE]);
    trigger(fixture)?.click();
    await settle(fixture);

    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await settle(fixture);

    expect(popover()).toBeNull();
    expect(document.activeElement).toBe(trigger(fixture));
  });

  it('ignores other keys', async () => {
    const fixture = await render([ALBUM, SINGLE]);
    trigger(fixture)?.click();
    await settle(fixture);

    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
    await settle(fixture);

    expect(popover()).not.toBeNull();
  });

  it('closes on a click outside', async () => {
    const fixture = await render([ALBUM, SINGLE]);
    trigger(fixture)?.click();
    await settle(fixture);

    document.body.click();
    await settle(fixture);

    expect(popover()).toBeNull();
  });

  it('writes the dates in the language of the visitor, with their precision', async () => {
    const fixture = await render(
      [{ value: '2014', precision: ReleaseDatePrecision.YEAR }, SINGLE],
      SINGLE,
      Language.PT,
    );

    expect(trigger(fixture)?.textContent?.trim()).toBe('2 datas encontradas');
    trigger(fixture)?.click();
    await settle(fixture);

    expect(
      [...(popover() as HTMLElement).querySelectorAll('li')].map((item) =>
        item.textContent?.trim(),
      ),
    ).toEqual(['2014', '28 de julho de 2014 exibida']);
  });
});
