import { Clipboard } from '@angular/cdk/clipboard';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LookupStatus } from '../../../../../contract/tracks.enums';
import { Language } from '../../../../core/i18n/i18n.enums';
import { i18nTestProviders, useLanguage } from '../../../../testing/i18n-testing';
import { UnresolvedStatus } from '../../domain/domain.types';
import { IsrcCard } from './isrc-card';

async function render(
  status: UnresolvedStatus,
  language = Language.EN,
): Promise<ComponentFixture<IsrcCard>> {
  TestBed.configureTestingModule({ imports: [IsrcCard], providers: i18nTestProviders });
  await useLanguage(language);
  const fixture = TestBed.createComponent(IsrcCard);
  fixture.componentRef.setInput('isrc', 'BR1SP1200070');
  fixture.componentRef.setInput('status', status);
  await fixture.whenStable();
  return fixture;
}

const root = (fixture: ComponentFixture<IsrcCard>) => fixture.nativeElement as HTMLElement;
const text = (fixture: ComponentFixture<IsrcCard>, selector: string) =>
  root(fixture).querySelector(selector)?.textContent?.trim();

describe('IsrcCard', () => {
  beforeEach(() => localStorage.clear());

  describe('copy button', () => {
    it('copies the code of the ISRC, whether Spotify does not know it or the lookup failed', async () => {
      for (const status of [LookupStatus.NOT_FOUND, LookupStatus.ERROR] as const) {
        TestBed.resetTestingModule();
        const copy = vi.fn(() => true);
        TestBed.configureTestingModule({
          imports: [IsrcCard],
          providers: [...i18nTestProviders, { provide: Clipboard, useValue: { copy } }],
        });
        await useLanguage(Language.EN);
        const fixture = TestBed.createComponent(IsrcCard);
        fixture.componentRef.setInput('isrc', 'BR1SP1200070');
        fixture.componentRef.setInput('status', status);
        await fixture.whenStable();

        (root(fixture).querySelector('orp-copy-button button') as HTMLButtonElement).click();

        expect(copy).toHaveBeenCalledExactlyOnceWith('BR1SP1200070');
      }
    });

    it('is named after the ISRC, in the visitor language', async () => {
      const english = await render(LookupStatus.NOT_FOUND);
      expect(
        root(english).querySelector('orp-copy-button button')?.getAttribute('aria-label'),
      ).toBe('Copy ISRC BR1SP1200070');
      TestBed.resetTestingModule();

      const portuguese = await render(LookupStatus.NOT_FOUND, Language.PT);
      expect(
        root(portuguese).querySelector('orp-copy-button button')?.getAttribute('aria-label'),
      ).toBe('Copiar o ISRC BR1SP1200070');
    });
  });

  describe('an ISRC Spotify does not know', () => {
    it('shows the code and says it was not found', async () => {
      const fixture = await render(LookupStatus.NOT_FOUND);

      expect(text(fixture, '.card__isrc')).toBe('BR1SP1200070');
      expect(text(fixture, '.card__message')).toBe('ISRC not found on Spotify');
    });

    it('uses a search icon, hidden from assistive technology', async () => {
      const fixture = await render(LookupStatus.NOT_FOUND);

      const icon = root(fixture).querySelector('i');
      expect(icon?.classList).toContain('pi-search');
      expect(icon?.getAttribute('aria-hidden')).toBe('true');
    });

    it('is not styled as a failure', async () => {
      const fixture = await render(LookupStatus.NOT_FOUND);

      expect(root(fixture).querySelector('.card--failed')).toBeNull();
    });
  });

  describe('an ISRC whose lookup failed', () => {
    it('shows the code and says it could not be loaded', async () => {
      const fixture = await render(LookupStatus.ERROR);

      expect(text(fixture, '.card__isrc')).toBe('BR1SP1200070');
      expect(text(fixture, '.card__message')).toBe('Could not load this ISRC');
    });

    it('uses a warning icon and the failure style, so it differs from "not found" beyond the words', async () => {
      const fixture = await render(LookupStatus.ERROR);

      expect(root(fixture).querySelector('i')?.classList).toContain('pi-exclamation-triangle');
      expect(root(fixture).querySelector('.card--failed')).not.toBeNull();
    });
  });

  it.each<[UnresolvedStatus, Language, string]>([
    [LookupStatus.NOT_FOUND, Language.PT, 'ISRC não encontrado no Spotify'],
    [LookupStatus.ERROR, Language.PT, 'Não foi possível carregar este ISRC'],
    [LookupStatus.NOT_FOUND, Language.RU, 'ISRC не найден в Spotify'],
    [LookupStatus.ERROR, Language.TR, 'Bu ISRC yüklenemedi'],
  ])('is translated (%s, %s)', async (status, language, expected) => {
    const fixture = await render(status, language);

    expect(text(fixture, '.card__message')).toBe(expected);
  });

  it('follows a language change while on screen', async () => {
    const fixture = await render(LookupStatus.NOT_FOUND);

    await useLanguage(Language.FR);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(text(fixture, '.card__message')).toBe('ISRC introuvable sur Spotify');
  });
});
